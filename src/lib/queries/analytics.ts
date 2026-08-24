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

  // Última métrica cargada por cuenta (una query por cuenta sería N+1 real,
  // pero la cantidad de cuentas sociales de una agencia chica/mediana no lo
  // justifica evitar — mismo patrón que getSocialAccountsOverview).
  const latestByAccount = await Promise.all(
    accountIds.map((id) =>
      supabase
        .from("social_metrics")
        .select("reach, followers, engagement_rate")
        .eq("social_account_id", id)
        .order("metric_date", { ascending: false })
        .limit(1)
        .maybeSingle()
    )
  );

  const rows = latestByAccount.map((r) => r.data).filter((r): r is NonNullable<typeof r> => Boolean(r));
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

  const dashboards = await Promise.all(
    Array.from(byPlatform.entries()).map(async ([platform, ids]) => {
      const latest = await Promise.all(
        ids.map((id) =>
          supabase
            .from("social_metrics")
            .select("reach, followers, engagement_rate")
            .eq("social_account_id", id)
            .order("metric_date", { ascending: false })
            .limit(1)
            .maybeSingle()
        )
      );
      const rows = latest.map((r) => r.data).filter((r): r is NonNullable<typeof r> => Boolean(r));
      return {
        platform,
        accountCount: ids.length,
        totalReach: rows.reduce((sum, r) => sum + (r.reach ?? 0), 0),
        totalFollowers: rows.reduce((sum, r) => sum + (r.followers ?? 0), 0),
        avgEngagementRate: rows.length
          ? rows.reduce((sum, r) => sum + Number(r.engagement_rate ?? 0), 0) / rows.length
          : 0,
      } satisfies PlatformDashboard;
    })
  );

  return dashboards;
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

  const rows = await Promise.all(
    accounts.map(async (acc) => {
      const { data: metrics } = await supabase
        .from("social_metrics")
        .select("id, metric_date, reach, impressions, engagement_rate, followers, plays")
        .eq("social_account_id", acc.id)
        .gte("metric_date", since)
        .order("metric_date", { ascending: false });

      const clientName = (acc.clients as unknown as { name: string } | null)?.name ?? "—";
      return (metrics ?? []).map((m) => ({
        id: m.id,
        clientName,
        platform: acc.platform,
        accountName: acc.display_name,
        metricDate: m.metric_date,
        reach: m.reach,
        impressions: m.impressions,
        engagementRate: Number(m.engagement_rate ?? 0),
        followers: m.followers,
        plays: m.plays,
      }));
    })
  );

  return rows.flat().sort((a, b) => (a.metricDate < b.metricDate ? 1 : -1));
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
