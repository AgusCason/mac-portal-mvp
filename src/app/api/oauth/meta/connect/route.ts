import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

/**
 * Punto de partida del flujo OAuth de Meta (Instagram/Facebook Graph API)
 * para conectar la cuenta de un cliente. Fase Avanzada — requiere:
 *  1. Una Meta App en developers.facebook.com con productos
 *     "Instagram Graph API" + "Facebook Login for Business".
 *  2. META_APP_ID / META_APP_SECRET en las env vars (ver .env.example).
 *  3. Que el cliente sea admin de la página de Facebook vinculada a su
 *     cuenta de Instagram profesional.
 *
 * Este endpoint arma la URL de autorización y redirige. El callback
 * (/api/oauth/meta/callback, a implementar) intercambia el `code` por un
 * access token de larga duración y lo guarda en `social_accounts`.
 */
export async function GET(request: NextRequest) {
  await requireAdmin();

  const appId = process.env.META_APP_ID;
  const redirectUri = `${request.nextUrl.origin}/api/oauth/meta/callback`;
  const clientId = request.nextUrl.searchParams.get("clientId");

  if (!appId) {
    return NextResponse.json(
      { error: "META_APP_ID no configurado todavía (ver .env.example)." },
      { status: 501 }
    );
  }

  const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", clientId ?? "");
  authUrl.searchParams.set(
    "scope",
    "instagram_basic,instagram_manage_insights,pages_show_list"
  );

  return NextResponse.redirect(authUrl);
}
