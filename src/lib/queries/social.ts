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
