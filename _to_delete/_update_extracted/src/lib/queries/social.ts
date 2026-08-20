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
export async function getSocialAccountsOverview(): Promise<SocialAccountWithLatestMetric[]> {
  const supabase = await createClient();
  const { data: accounts, error } = await supabase
    .from("social_accounts")
    .select("*, clients(name)")
    .order("connected_at", { ascending: false });

  if (error || !accounts) return [];

  const results = await Promise.all(
    accounts.map(async (acc) => {
      const { data: latest } = await supabase
        .from("social_metrics")
        .select("*")
        .eq("social_account_id", acc.id)
        .order("metric_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { clients, ...rest } = acc as SocialAccount & {
        clients: { name: string } | null;
      };
      return { ...rest, client_name: clients?.name ?? "—", latest: latest ?? null };
    })
  );

  return results;
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

  return Promise.all(
    accounts.map(async (acc) => {
      const { data: metrics } = await supabase
        .from("social_metrics")
        .select("reach, impressions, engagement_rate, followers, plays, metric_date")
        .eq("social_account_id", acc.id)
        .gte("metric_date", since)
        .order("metric_date", { ascending: false });

      const rows = metrics ?? [];
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
    })
  );
}
