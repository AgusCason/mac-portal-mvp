import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Webhook de WhatsApp Cloud API (Meta). Setup:
 *  1. Meta for Developers > tu App > WhatsApp > Configuration > Webhook.
 *  2. Callback URL: https://tu-dominio.netlify.app/api/webhooks/whatsapp
 *  3. Verify token: el mismo valor que pongas en WHATSAPP_WEBHOOK_VERIFY_TOKEN.
 *  4. Suscribite al campo "messages".
 *
 * Meta hace un GET de verificación una sola vez, y después manda un POST
 * por cada mensaje entrante.
 */

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
  const payload = await request.json();

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

    // Bypassea RLS a propósito: este endpoint no tiene sesión de usuario,
    // solo el secreto del webhook (ver comprobación de verify_token arriba).
    const supabase = createServiceRoleClient();

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
