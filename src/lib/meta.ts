import "server-only";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export type MetaResult<T> = { ok: true; data: T } | { ok: false; error: string };

function extractGraphError(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error?: { message?: string } }).error;
    if (err?.message) return err.message;
  }
  return fallback;
}

/**
 * Paso 1 del intercambio OAuth: cambia el `code` que Meta mandó al
 * redirect_uri por un access token de usuario de corta duración (~1-2hs).
 * `redirectUri` tiene que ser EXACTAMENTE el mismo string que se usó para
 * armar la URL de autorización en /api/oauth/meta/connect — Meta rechaza el
 * intercambio si no coincide carácter por carácter.
 */
export async function exchangeCodeForAccessToken(
  code: string,
  redirectUri: string
): Promise<MetaResult<{ accessToken: string; expiresIn: number | null }>> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return { ok: false, error: "Faltan META_APP_ID / META_APP_SECRET." };
  }

  try {
    const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
    url.searchParams.set("client_id", appId);
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("code", code);

    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data?.access_token) {
      return { ok: false, error: extractGraphError(data, `Meta respondió HTTP ${res.status}`) };
    }
    return { ok: true, data: { accessToken: data.access_token, expiresIn: data.expires_in ?? null } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error de red con Meta." };
  }
}

/**
 * Paso 2 (recomendado, no bloqueante): cambia el token de corta duración por
 * uno de larga duración (~60 días) — sin esto, la cuenta se "desconecta" sola
 * en un par de horas. Si este paso falla, el caller puede optar por seguir
 * con el token corto igual (mejor una conexión de corta duración que
 * ninguna).
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<MetaResult<{ accessToken: string; expiresIn: number | null }>> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return { ok: false, error: "Faltan META_APP_ID / META_APP_SECRET." };
  }

  try {
    const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("fb_exchange_token", shortLivedToken);

    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data?.access_token) {
      return { ok: false, error: extractGraphError(data, `Meta respondió HTTP ${res.status}`) };
    }
    return { ok: true, data: { accessToken: data.access_token, expiresIn: data.expires_in ?? null } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error de red con Meta." };
  }
}

export interface InstagramBusinessAccount {
  pageId: string;
  pageName: string;
  instagramAccountId: string;
  instagramUsername: string | null;
}

/**
 * Recorre las páginas de Facebook que administra el usuario que se logueó y
 * devuelve las que tienen una cuenta de Instagram profesional vinculada —
 * es el único lugar de donde sale el ID real de Instagram (no lo pide
 * directamente el login). Si una agencia/cliente administra varias páginas,
 * el caller de hoy usa la primera con Instagram vinculado — elegir entre
 * varias queda para una iteración futura si hace falta.
 */
export async function getInstagramBusinessAccounts(
  userAccessToken: string
): Promise<MetaResult<InstagramBusinessAccount[]>> {
  try {
    const url = new URL(`${GRAPH_BASE}/me/accounts`);
    url.searchParams.set("fields", "id,name,instagram_business_account{id,username}");
    url.searchParams.set("access_token", userAccessToken);

    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: extractGraphError(data, `Meta respondió HTTP ${res.status}`) };
    }

    const pages = (data?.data ?? []) as Array<{
      id: string;
      name: string;
      instagram_business_account?: { id: string; username?: string };
    }>;

    const withInstagram = pages
      .filter((p) => p.instagram_business_account?.id)
      .map((p) => ({
        pageId: p.id,
        pageName: p.name,
        instagramAccountId: p.instagram_business_account!.id,
        instagramUsername: p.instagram_business_account?.username ?? null,
      }));

    return { ok: true, data: withInstagram };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error de red con Meta." };
  }
}
