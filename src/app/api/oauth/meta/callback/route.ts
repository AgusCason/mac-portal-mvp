import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import {
  exchangeCodeForAccessToken,
  exchangeForLongLivedToken,
  getInstagramBusinessAccounts,
} from "@/lib/meta";

/**
 * Segunda mitad del flujo OAuth iniciado en /api/oauth/meta/connect. Meta
 * redirige acá con `code` (para intercambiar por un access token) y `state`
 * (el `clientId` que /connect le pasó de ida — así sabemos a qué cliente
 * conectarle la cuenta, ver connect/route.ts).
 *
 * Pasos: 1) validar que el `state` sea un cliente real, 2) cambiar el code
 * por un token corto, 3) extenderlo a uno de larga duración (~60 días,
 * best-effort — si falla seguimos con el corto en vez de abortar), 4) buscar
 * qué página de Facebook del usuario tiene una cuenta de Instagram
 * profesional vinculada, 5) guardar la cuenta en `social_accounts` y el
 * token cifrado vía `social_account_store_token` (pgcrypto, ver
 * supabase/migrations/0038_social_account_tokens.sql).
 *
 * Todo error redirige de vuelta a /admin/redes con `?instagramError=<code>`
 * en vez de mostrar una pantalla de error suelta — esa página lee el query
 * param y muestra el mensaje (ver AdminRedesPage).
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();

  const redesUrl = new URL("/admin/redes", request.nextUrl.origin);
  const fail = (code: string) => {
    redesUrl.searchParams.set("instagramError", code);
    return NextResponse.redirect(redesUrl);
  };

  const params = request.nextUrl.searchParams;
  const oauthError = params.get("error");
  if (oauthError) {
    // El usuario canceló el diálogo de Meta, o Meta rechazó el pedido.
    return fail("denied");
  }

  const code = params.get("code");
  const clientId = params.get("state");
  if (!code || !clientId) return fail("invalid_request");

  const supabase = await createSupabaseServerClient();

  const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (!client) return fail("invalid_client");

  // Mismo origin+path que armó /connect — Meta exige que coincida carácter
  // por carácter con el que se usó para pedir el `code`.
  const redirectUri = `${request.nextUrl.origin}/api/oauth/meta/callback`;

  const shortLived = await exchangeCodeForAccessToken(code, redirectUri);
  if (!shortLived.ok) {
    console.error("[meta/callback] exchangeCodeForAccessToken:", shortLived.error);
    return fail("exchange_failed");
  }

  // Best-effort: si el intercambio a larga duración falla, seguimos con el
  // token corto en vez de perder la conexión entera — dura menos, pero se
  // puede volver a extender más adelante reconectando.
  const longLived = await exchangeForLongLivedToken(shortLived.data.accessToken);
  const accessToken = longLived.ok ? longLived.data.accessToken : shortLived.data.accessToken;
  if (!longLived.ok) {
    console.error("[meta/callback] exchangeForLongLivedToken (no bloqueante):", longLived.error);
  }

  const pages = await getInstagramBusinessAccounts(accessToken);
  if (!pages.ok) {
    console.error("[meta/callback] getInstagramBusinessAccounts:", pages.error);
    return fail("fetch_pages_failed");
  }
  const [instagram] = pages.data;
  if (!instagram) {
    // El usuario tiene páginas de Facebook, pero ninguna con una cuenta de
    // Instagram profesional vinculada — el error más común de este flujo.
    return fail("no_instagram_account");
  }

  const { data: account, error: upsertError } = await supabase
    .from("social_accounts")
    .upsert(
      {
        client_id: clientId,
        platform: "instagram",
        external_account_id: instagram.instagramAccountId,
        display_name: instagram.instagramUsername,
        connected_by: admin.id,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "client_id,platform" }
    )
    .select("id")
    .single();

  if (upsertError || !account) {
    console.error("[meta/callback] upsert social_accounts:", upsertError?.message);
    return fail("save_failed");
  }

  // El token cifrado es opcional para que la conexión no se pierda entera si
  // todavía no se configuró ninguna passphrase — sin él, la cuenta queda
  // conectada y visible, pero un futuro job de sincronización de métricas no
  // va a poder llamar a la Graph API en su nombre hasta reconectarla.
  const passphrase = process.env.META_TOKEN_ENCRYPTION_KEY || process.env.VAULT_ENCRYPTION_KEY;
  if (passphrase) {
    const { error: tokenError } = await supabase.rpc("social_account_store_token", {
      p_id: account.id,
      p_token: accessToken,
      p_passphrase: passphrase,
    });
    if (tokenError) console.error("[meta/callback] social_account_store_token:", tokenError.message);
  } else {
    console.warn(
      "[meta/callback] META_TOKEN_ENCRYPTION_KEY / VAULT_ENCRYPTION_KEY no configurada — cuenta conectada sin guardar el token."
    );
  }

  redesUrl.searchParams.set("instagramConnected", instagram.instagramUsername ?? "1");
  return NextResponse.redirect(redesUrl);
}
