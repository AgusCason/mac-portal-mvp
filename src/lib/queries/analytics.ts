import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SocialPlatform, UtmLink } from "@/types/database";

/**
 * Analytics > Overview — KPIs agregados de TODAS las cuentas sociales de la
 * agencia (no de un solo cliente, como sí hace el Módulo de Reportes). Usa
 * la métrica más reciente cargada por cuenta, igual que /admin/redes.
 */
export interface AnalyticsOverview {
  connectedAccounts: number;
  totalReach: number;
  totalFollowers: number;
  avgEngagementRate: number;
  activeAlerts: number;
  reportsThisMonth: number;
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: accounts }, { count: activeAlerts }, { count: reportsThisMonth }] = await Promise.all([
    supabase.from("social_accounts").select("id"),
    supabase.from("metric_alerts").select("id", { count: "exact", head: true }),
    supabase
      .from("performance_reports")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString()),
  ]);

  const accountIds = (accounts ?? []).map((a) => a.id);
  if (accountIds.length === 0) {
    return {
      connectedAccounts: 0,
      totalReach: 0,
      totalFollowers: 0,
      avgEngagementRate: 0,
      activeAlerts: activeAlerts ?? 0,
      reportsThisMonth: reportsThisMonth ?? 0,
    };
  }

  // Última métrica cargada por cuenta — 1 sola llamada al RPC
  // `latest_social_metrics` (DISTINCT ON) en vez de 1 query por cuenta; ver
  // 0043_latest_social_metrics_rpc.sql. El comentario anterior asumía que
  // esto no valía la pena para una agencia chica/mediana, pero es justo el
  // patrón que se vuelve notorio a medida que se conectan más cuentas.
  const { data } = await supabase.rpc("latest_social_metrics", {
    p_account_ids: accountIds,
  });
  const rows = data ?? [];
  const totalReach = rows.reduce((sum, r) => sum + (r.reach ?? 0), 0);
  const totalFollowers = rows.reduce((sum, r) => sum + (r.followers ?? 0), 0);
  const avgEngagementRate = rows.length
    ? rows.reduce((sum, r) => sum + Number(r.engagement_rate ?? 0), 0) / rows.length
    : 0;

  return {
    connectedAccounts: accountIds.length,
    totalReach,
    totalFollowers,
    avgEngagementRate,
    activeAlerts: activeAlerts ?? 0,
    reportsThisMonth: reportsThisMonth ?? 0,
  };
}

/** Un punto del gráfico de tendencia de alcance en Analytics > Overview. */
export interface ReachTrendPoint {
  date: string;
  reach: number;
}

/**
 * Analytics > Overview — alcance total (suma de todas las cuentas) por día,
 * últimos `days` días. Antes el Overview solo mostraba el alcance más
 * reciente como número suelto; esto arma la serie para graficar la
 * tendencia real en vez de una sola cifra estática.
 */
export async function getReachTrend(days = 14): Promise<ReachTrendPoint[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("social_metrics")
    .select("metric_date, reach")
    .gte("metric_date", sinceStr);

  if (error) {
    console.error("[getReachTrend]", error.message);
    return [];
  }

  const byDate = new Map<string, number>();
  for (const row of data ?? []) {
    byDate.set(row.metric_date, (byDate.get(row.metric_date) ?? 0) + (row.reach ?? 0));
  }

  const points: ReachTrendPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    points.push({ date: key, reach: byDate.get(key) ?? 0 });
  }
  return points;
}

/** Una tarjeta de Analytics > Dashboards: resumen agregado por plataforma. */
export interface PlatformDashboard {
  platform: SocialPlatform;
  accountCount: number;
  totalReach: number;
  totalFollowers: number;
  avgEngagementRate: number;
}

/**
 * Analytics > Dashboards — a diferencia de MB Suite (que arma dashboards
 * "a medida" arrastrando widgets), acá se arman 3 vistas fijas pero con
 * datos reales: una por plataforma conectada. Cada una resume cuántas
 * cuentas hay, alcance, seguidores y engagement agregados.
 */
export async function getPlatformDashboards(): Promise<PlatformDashboard[]> {
  const supabase = await createClient();
  const { data: accounts } = await supabase.from("social_accounts").select("id, platform");
  if (!accounts || accounts.length === 0) return [];

  const byPlatform = new Map<SocialPlatform, string[]>();
  for (const a of accounts) {
    const list = byPlatform.get(a.platform) ?? [];
    list.push(a.id);
    byPlatform.set(a.platform, list);
  }

  // Antes: doble N+1 anidado (1 query por plataforma × 1 query por cuenta
  // dentro de esa plataforma) — el peor caso de los tres que había en este
  // archivo. Se resuelve con 1 sola llamada al RPC para TODAS las cuentas de
  // la agencia, y después se agrupa por plataforma acá en JS.
  const { data } = await supabase.rpc("latest_social_metrics", {
    p_account_ids: accounts.map((a) => a.id),
  });
  const latestByAccount = new Map((data ?? []).map((row) => [row.social_account_id, row]));

  return Array.from(byPlatform.entries()).map(([platform, ids]) => {
    const rows = ids.map((id) => latestByAccount.get(id)).filter((r): r is NonNullable<typeof r> => Boolean(r));
    return {
      platform,
      accountCount: ids.length,
      totalReach: rows.reduce((sum, r) => sum + (r.reach ?? 0), 0),
      totalFollowers: rows.reduce((sum, r) => sum + (r.followers ?? 0), 0),
      avgEngagementRate: rows.length
        ? rows.reduce((sum, r) => sum + Number(r.engagement_rate ?? 0), 0) / rows.length
        : 0,
    } satisfies PlatformDashboard;
  });
}

/** Una fila de la tabla plana de Analytics > Explorer. */
export interface ExplorerRow {
  id: string;
  clientName: string;
  platform: SocialPlatform;
  accountName: string | null;
  metricDate: string;
  reach: number;
  impressions: number;
  engagementRate: number;
  followers: number;
  plays: number;
}

export interface ExplorerFilters {
  clientId?: string;
  platform?: SocialPlatform;
  days?: number;
}

/**
 * Analytics > Explorer — tabla plana y filtrable de todas las métricas
 * diarias cargadas, cruzando cuenta + cliente. Pensado para explorar en
 * detalle en vez de mirar solo el resumen del Overview.
 */
export async function getExplorerRows(filters: ExplorerFilters = {}): Promise<ExplorerRow[]> {
  const supabase = await createClient();
  const days = filters.days ?? 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let accountsQuery = supabase
    .from("social_accounts")
    .select("id, platform, display_name, client_id, clients(name)");
  if (filters.clientId) accountsQuery = accountsQuery.eq("client_id", filters.clientId);
  if (filters.platform) accountsQuery = accountsQuery.eq("platform", filters.platform);

  const { data: accounts } = await accountsQuery;
  if (!accounts || accounts.length === 0) return [];

  // Antes: 1 query por cuenta para sus métricas del rango — potencialmente
  // el peor de los tres N+1 de este archivo, porque acá no hay scoping por
  // cliente (puede ser TODAS las cuentas de la agencia). 1 sola query con
  // `.in(...)` trae todo de una vez.
  const accountsById = new Map(accounts.map((acc) => [acc.id, acc]));
  const { data: allMetrics } = await supabase
    .from("social_metrics")
    .select("id, social_account_id, metric_date, reach, impressions, engagement_rate, followers, plays")
    .in("social_account_id", accounts.map((a) => a.id))
    .gte("metric_date", since)
    .order("metric_date", { ascending: false });

  const rows = (allMetrics ?? []).map((m) => {
    const acc = accountsById.get(m.social_account_id);
    const clientName = (acc?.clients as unknown as { name: string } | null)?.name ?? "—";
    return {
      id: m.id,
      clientName,
      platform: acc?.platform as SocialPlatform,
      accountName: acc?.display_name ?? null,
      metricDate: m.metric_date,
      reach: m.reach,
      impressions: m.impressions,
      engagementRate: Number(m.engagement_rate ?? 0),
      followers: m.followers,
      plays: m.plays,
    };
  });

  return rows.sort((a, b) => (a.metricDate < b.metricDate ? 1 : -1));
}

/** Una fila de Analytics > Alertas. */
export interface MetricAlertRow {
  id: string;
  clientName: string;
  metricType: string;
  previousAvg: number;
  currentValue: number;
  dropPct: number;
  metricDate: string;
  createdAt: string;
}

/**
 * Analytics > Alertas — listado completo de las caídas de métricas
 * detectadas por el cron (Fase 3.4), no solo las 5 últimas que muestra el
 * dashboard principal.
 */
export async function getAllMetricAlerts(): Promise<MetricAlertRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("metric_alerts")
    .select("id, metric_type, previous_avg, current_value, drop_pct, metric_date, created_at, clients(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[getAllMetricAlerts]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    clientName: (row.clients as unknown as { name: string } | null)?.name ?? "—",
    metricType: row.metric_type,
    previousAvg: Number(row.previous_avg),
    currentValue: Number(row.current_value),
    dropPct: Number(row.drop_pct),
    metricDate: row.metric_date,
    createdAt: row.created_at,
  }));
}

/** Analytics > UTM Builder — historial de campañas armadas. */
export async function getUtmLinks(): Promise<(UtmLink & { clientName: string | null })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utm_links")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[getUtmLinks]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const { clients, ...rest } = row as UtmLink & { clients: { name: string } | null };
    return { ...rest, clientName: clients?.name ?? null };
  });
}
