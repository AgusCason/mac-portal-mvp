import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/security/rate-limit";

/**
 * Webhook de WhatsApp Cloud API (Meta). Setup:
 *  1. Meta for Developers > tu App > WhatsApp > Configuration > Webhook.
 *  2. Callback URL: https://tu-dominio.netlify.app/api/webhooks/whatsapp
 *  3. Verify token: el mismo valor que pongas en WHATSAPP_WEBHOOK_VERIFY_TOKEN.
 *  4. Suscribite al campo "messages".
 *  5. (Recomendado) `WHATSAPP_APP_SECRET`: el "App secret" de tu App de
 *     Meta — habilita la verificación de firma HMAC de abajo. Si no está
 *     configurado, el webhook sigue funcionando igual que antes (soft-fail
 *     con un log) para no romper despliegues existentes, pero queda sin esa
 *     capa extra de seguridad hasta que lo cargues.
 *
 * Meta hace un GET de verificación una sola vez, y después manda un POST
 * por cada mensaje entrante.
 */

/**
 * Verifica que el POST venga realmente de Meta comparando el header
 * `X-Hub-Signature-256` (HMAC-SHA256 del body crudo con el App Secret)
 * contra uno calculado acá — sin esto, cualquiera que adivine la URL puede
 * insertar mensajes falsos como si vinieran de un cliente. `timingSafeEqual`
 * evita filtrar la firma esperada por timing.
 */
function isValidSignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(provided, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!isValidSignature(rawBody, signature, appSecret)) {
      console.warn("[whatsapp webhook] Firma inválida — request rechazado.");
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } else {
    console.warn(
      "[whatsapp webhook] WHATSAPP_APP_SECRET no configurado — el webhook acepta requests sin verificar firma."
    );
  }

  // Rate limit por IP: frena un flood de requests al webhook antes de tocar
  // la base por cada uno (bloqueo automático temporal — ver 0027_security_hardening.sql).
  const supabase = createServiceRoleClient();
  const ip = getClientIpFromRequest(request);
  const ipAllowed = await checkRateLimit(supabase, `webhook:whatsapp:ip:${ip}`, {
    maxHits: 60,
    windowSeconds: 60,
    blockMinutes: 30,
  });
  if (!ipAllowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const payload = JSON.parse(rawBody);

  try {
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    if (!message) {
      // Podés recibir "statuses" (delivered/read) además de "messages" —
      // los ignoramos acá, pero quedan loggeados por si los querés procesar.
      return NextResponse.json({ ok: true, ignored: true });
    }

    const fromPhone: string = message.from; // formato E.164 sin "+"
    const body: string = message.text?.body ?? "[mensaje sin texto — adjunto/multimedia]";

    // Rate limit adicional por número de origen (más preciso que solo IP —
    // Meta puede reenviar mensajes de muchos clientes desde la misma IP suya).
    const phoneAllowed = await checkRateLimit(supabase, `webhook:whatsapp:phone:${fromPhone}`, {
      maxHits: 20,
      windowSeconds: 60,
      blockMinutes: 15,
    });
    if (!phoneAllowed) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .ilike("contact_phone", `%${fromPhone.slice(-10)}%`)
      .maybeSingle();

    if (!client) {
      console.warn(`[whatsapp webhook] Sin cliente asociado al teléfono ${fromPhone}`);
      return NextResponse.json({ ok: true, matched: false });
    }

    await supabase.from("chat_messages").insert({
      client_id: client.id,
      direction: "inbound",
      body,
      whatsapp_message_id: message.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[whatsapp webhook]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
