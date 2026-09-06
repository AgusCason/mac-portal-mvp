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

/**
 * Trae UN SOLO metric del endpoint de insights, en vez de pedir varios en la
 * misma llamada — a propósito: la API de Insights de Instagram rechaza la
 * llamada ENTERA si un solo metric del listado no es válido para esa cuenta
 * (metrics deprecados o exclusivos de cierto tipo de contenido son moneda
 * corriente acá, Meta los cambia con cierta frecuencia). Pedirlos aislados
 * hace que un metric roto/renombrado no tire abajo a los demás — el caller
 * simplemente no recibe ese valor puntual, logueado como advertencia.
 */
async function fetchInsightMetric(
  url: URL,
  metric: string,
  period: "day" | "lifetime"
): Promise<number | null> {
  const withMetric = new URL(url);
  withMetric.searchParams.set("metric", metric);
  withMetric.searchParams.set("period", period);

  try {
    const res = await fetch(withMetric);
    const data = await res.json();
    if (!res.ok) {
      console.warn(`[meta] metric "${metric}" no disponible:`, extractGraphError(data, `HTTP ${res.status}`));
      return null;
    }
    const value = data?.data?.[0]?.values?.at(-1)?.value;
    return typeof value === "number" ? value : null;
  } catch (err) {
    console.warn(`[meta] error de red pidiendo metric "${metric}":`, err instanceof Error ? err.message : err);
    return null;
  }
}

export interface InstagramAccountDailyMetrics {
  reach: number | null;
  impressions: number | null;
  followers: number | null;
}

/**
 * Métricas de cuenta del día — cada una se pide por separado (ver
 * `fetchInsightMetric`) así que si Meta deprecó o renombró alguna, las demás
 * igual llegan. `profile_views` y otros metrics de "acciones de contacto"
 * (website_clicks, phone_call_clicks, etc.) quedaron deprecados por Meta en
 * 2025 — a propósito no se piden acá.
 */
export async function getInstagramAccountDailyMetrics(
  instagramAccountId: string,
  accessToken: string
): Promise<InstagramAccountDailyMetrics> {
  const url = new URL(`${GRAPH_BASE}/${instagramAccountId}/insights`);
  url.searchParams.set("access_token", accessToken);

  const [reach, impressions, followers] = await Promise.all([
    fetchInsightMetric(url, "reach", "day"),
    fetchInsightMetric(url, "impressions", "day"),
    fetchInsightMetric(url, "follower_count", "day"),
  ]);

  return { reach, impressions, followers };
}

export interface InstagramMedia {
  id: string;
  mediaType: string | null;
  mediaProductType: string | null;
  caption: string | null;
  permalink: string | null;
  thumbnailUrl: string | null;
  timestamp: string | null;
  likeCount: number | null;
  commentsCount: number | null;
}

/**
 * Publicaciones recientes de la cuenta. `like_count`/`comments_count` salen
 * del objeto del media en sí (no de /insights) — son campos estables del
 * nodo, no parte de la API de Insights que cambia más seguido.
 */
export async function getRecentInstagramMedia(
  instagramAccountId: string,
  accessToken: string,
  limit = 25
): Promise<MetaResult<InstagramMedia[]>> {
  try {
    const url = new URL(`${GRAPH_BASE}/${instagramAccountId}/media`);
    url.searchParams.set(
      "fields",
      "id,media_type,media_product_type,caption,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count"
    );
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: extractGraphError(data, `Meta respondió HTTP ${res.status}`) };
    }

    const media = (data?.data ?? []) as Array<{
      id: string;
      media_type?: string;
      media_product_type?: string;
      caption?: string;
      permalink?: string;
      thumbnail_url?: string;
      media_url?: string;
      timestamp?: string;
      like_count?: number;
      comments_count?: number;
    }>;

    return {
      ok: true,
      data: media.map((m) => ({
        id: m.id,
        mediaType: m.media_type ?? null,
        mediaProductType: m.media_product_type ?? null,
        caption: m.caption ?? null,
        permalink: m.permalink ?? null,
        // Los reels no siempre traen thumbnail_url — media_url sirve de
        // respaldo para no dejar la miniatura vacía en ese caso.
        thumbnailUrl: m.thumbnail_url ?? m.media_url ?? null,
        timestamp: m.timestamp ?? null,
        likeCount: m.like_count ?? null,
        commentsCount: m.comments_count ?? null,
      })),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error de red con Meta." };
  }
}

export interface InstagramMediaMetrics {
  reach: number | null;
  saved: number | null;
  plays: number | null;
  totalInteractions: number | null;
}

/**
 * Insights de UNA publicación puntual — igual que a nivel cuenta, cada
 * metric se pide aislado. `plays` solo aplica a video/reels; pedirlo para
 * una imagen simplemente devuelve null acá en vez de romper el resto.
 */
export async function getInstagramMediaMetrics(
  mediaId: string,
  mediaType: string | null,
  accessToken: string
): Promise<InstagramMediaMetrics> {
  const url = new URL(`${GRAPH_BASE}/${mediaId}/insights`);
  url.searchParams.set("access_token", accessToken);

  const isVideo = mediaType === "VIDEO" || mediaType === "REEL" || mediaType === "REELS";
  const [reach, saved, totalInteractions, plays] = await Promise.all([
    fetchInsightMetric(url, "reach", "lifetime"),
    fetchInsightMetric(url, "saved", "lifetime"),
    fetchInsightMetric(url, "total_interactions", "lifetime"),
    isVideo ? fetchInsightMetric(url, "plays", "lifetime") : Promise.resolve(null),
  ]);

  return { reach, saved, plays, totalInteractions };
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
