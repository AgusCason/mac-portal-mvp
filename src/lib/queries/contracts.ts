import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Contract } from "@/types/database";

export interface ContractWithClient extends Contract {
  client_name: string;
}

/** Lista contratos. RLS acota a admin (todos) o al cliente dueño (los suyos). */
export async function getContracts(clientId?: string, limit = 500): Promise<ContractWithClient[]> {
  const supabase = await createClient();
  let query = supabase
    .from("contracts")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) {
    console.error("[getContracts]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const { clients, ...rest } = row as Contract & { clients: { name: string } | null };
    return { ...rest, client_name: clients?.name ?? "—" };
  });
}
