import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Competitor } from "@/types/database";

export interface CompetitorWithClient extends Competitor {
  client_name: string | null;
}

/** Social Media > Competidores — perfiles de la competencia, todas las cuentas. */
export async function getCompetitors(limit = 300): Promise<CompetitorWithClient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitors")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getCompetitors]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const typed = row as unknown as Competitor & { clients: { name: string } | null };
    const { clients, ...rest } = typed;
    return { ...rest, client_name: clients?.name ?? null };
  });
}
