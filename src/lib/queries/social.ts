import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SocialAccount, SocialMetric } from "@/types/database";

export interface SocialAccountWithLatestMetric extends SocialAccount {
  client_name: string;
  latest: SocialMetric | null;
}

/**
 * Cuentas sociales conectadas + su métrica más reciente. Vacío hasta que se
 * complete la integración real con Meta Graph API / TikTok / YouTube
 * (ver README § Módulo D — Fase Avanzada).
 */
export async function getSocialAccountsOverview(
  limit = 300
): Promise<SocialAccountWithLatestMetric[]> {
  const supabase = await createClient();
  const { data: accounts, error } = await supabase
    .from("social_accounts")
    .select("*, clients(name)")
    .order("connected_at", { ascending: false })
    .limit(limit);

  if (error || !accounts) return [];

  // Antes: 1 query por cuenta para su métrica más reciente (N+1 real, el
  // cuello de botella de "cambiar de sección" cuando la agencia crece). Se
  // reemplaza por 1 sola llamada al RPC `latest_social_metrics` (DISTINCT ON
  // en Postgres — PostgREST no puede expresar "el último por grupo" en una
  // consulta REST normal). Ver 0043_latest_social_metrics_rpc.sql.
  const accountIds = accounts.map((a) => a.id);
  const { data: latestRows } = await supabase.rpc("latest_social_metrics", {
    p_account_ids: accountIds,
  });
  const latestByAccount = new Map((latestRows ?? []).map((row) => [row.social_account_id, row]));

  return accounts.map((acc) => {
    const { clients, ...rest } = acc as SocialAccount & {
      clients: { name: string } | null;
    };
    return {
      ...rest,
      client_name: clients?.name ?? "—",
      latest: latestByAccount.get(acc.id) ?? null,
    };
  });
}

export interface PlatformMetricsSummary {
  platform: string;
  displayName: string | null;
  followers: number | null;
  totalReach: number;
  totalImpressions: number;
  avgEngagementRate: number;
  totalPlays: number;
  daysWithData: number;
}

/**
 * Agrega las métricas de todas las cuentas sociales de un cliente en los
 * últimos `days` días — el insumo crudo que el Módulo de Reportes con IA
 * le pasa a Claude para redactar el resumen ejecutivo. Si el cliente todavía
 * no tiene cuentas conectadas o no hay métricas cargadas, devuelve `[]`: la
 * generación del reporte sigue funcionando, Claude simplemente lo aclara.
 */
export async function getClientMetricsSummary(
  clientId: string,
  days = 30
): Promise<PlatformMetricsSummary[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("id, platform, display_name")
    .eq("client_id", clientId);

  if (!accounts || accounts.length === 0) return [];

  // Antes: 1 query por cuenta del cliente para sus métricas del período (N+1
  // acotado a un cliente, pero el mismo patrón se repetía en todos lados). 1
  // sola query con `.in(...)` trae todas las filas de todas las cuentas del
  // cliente, y se agrupan acá por cuenta.
  const accountIds = accounts.map((a) => a.id);
  const { data: allMetrics } = await supabase
    .from("social_metrics")
    .select("social_account_id, reach, impressions, engagement_rate, followers, plays, metric_date")
    .in("social_account_id", accountIds)
    .gte("metric_date", since)
    .order("metric_date", { ascending: false });

  const metricsByAccount = new Map<string, NonNullable<typeof allMetrics>>();
  for (const row of allMetrics ?? []) {
    const list = metricsByAccount.get(row.social_account_id) ?? [];
    list.push(row);
    metricsByAccount.set(row.social_account_id, list);
  }

  return accounts.map((acc) => {
    const rows = metricsByAccount.get(acc.id) ?? [];
    const totalReach = rows.reduce((sum, r) => sum + (r.reach ?? 0), 0);
    const totalImpressions = rows.reduce((sum, r) => sum + (r.impressions ?? 0), 0);
    const totalPlays = rows.reduce((sum, r) => sum + (r.plays ?? 0), 0);
    const avgEngagementRate = rows.length
      ? rows.reduce((sum, r) => sum + Number(r.engagement_rate ?? 0), 0) / rows.length
      : 0;

    return {
      platform: acc.platform,
      displayName: acc.display_name,
      followers: rows[0]?.followers ?? null,
      totalReach,
      totalImpressions,
      avgEngagementRate,
      totalPlays,
      daysWithData: rows.length,
    };
  });
}

export interface ClientPostMetric {
  id: string;
  platform: string;
  mediaType: string | null;
  permalink: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  postedAt: string | null;
  reach: number;
  likes: number;
  comments: number;
  saved: number;
  plays: number;
  engagementRate: number;
}

interface RawPostRow {
  id: string;
  media_type: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  posted_at: string | null;
  reach: number;
  likes: number;
  comments: number;
  saved: number;
  plays: number;
  engagement_rate: number;
  social_accounts: { platform: string } | null;
}

function mapPostRow(row: RawPostRow): ClientPostMetric {
  return {
    id: row.id,
    platform: row.social_accounts?.platform ?? "—",
    mediaType: row.media_type,
    permalink: row.permalink,
    thumbnailUrl: row.thumbnail_url,
    caption: row.caption,
    postedAt: row.posted_at,
    reach: row.reach,
    likes: row.likes,
    comments: row.comments,
    saved: row.saved,
    plays: row.plays,
    engagementRate: Number(row.engagement_rate ?? 0),
  };
}

/**
 * Publicaciones reales (no contenido planeado) de mejor y peor rendimiento
 * de un cliente en los últimos `days` días — el insumo por-publicación que
 * completa a `getClientMetricsSummary` (que solo agrega totales por
 * plataforma) para que tanto los Reportes con IA como el Asistente puedan
 * señalar EJEMPLOS concretos de qué funcionó y qué no, en vez de hablar en
 * abstracto. Se descartan publicaciones con `reach` 0 (todavía sin datos
 * sincronizados) para no ensuciar el ranking con ceros.
 */
export async function getClientTopPosts(
  clientId: string,
  days = 30,
  limit = 5
): Promise<{ topPosts: ClientPostMetric[]; bottomPosts: ClientPostMetric[] }> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // `!inner` habilita filtrar por columnas de la tabla embebida
  // (`social_accounts.client_id`) — sin él, PostgREST no acepta el `.eq`
  // sobre el embed.
  const baseSelect =
    "id, media_type, permalink, thumbnail_url, caption, posted_at, reach, likes, comments, saved, plays, engagement_rate, social_accounts!inner(platform, client_id)";

  const [{ data: top }, { data: bottom }] = await Promise.all([
    supabase
      .from("social_media_posts")
      .select(baseSelect)
      .eq("social_accounts.client_id", clientId)
      .gte("posted_at", since)
      .gt("reach", 0)
      .order("engagement_rate", { ascending: false })
      .limit(limit),
    supabase
      .from("social_media_posts")
      .select(baseSelect)
      .eq("social_accounts.client_id", clientId)
      .gte("posted_at", since)
      .gt("reach", 0)
      .order("engagement_rate", { ascending: true })
      .limit(limit),
  ]);

  const topPosts = ((top ?? []) as unknown as RawPostRow[]).map(mapPostRow);
  const bottomIds = new Set(topPosts.map((p) => p.id));
  const bottomPosts = ((bottom ?? []) as unknown as RawPostRow[])
    .map(mapPostRow)
    // Si hay pocas publicaciones en el período, el mismo post puede salir
    // "peor" y "mejor" a la vez — no tiene sentido mostrarlo duplicado.
    .filter((p) => !bottomIds.has(p.id));

  return { topPosts, bottomPosts };
}
