import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PerformanceReport } from "@/types/database";

export interface ReportWithClient extends PerformanceReport {
  client_name: string;
}

/**
 * Lista reportes. RLS acota: admin ve todos (borrador y publicados); el
 * cliente solo ve los suyos con status='published' (ver policy
 * `performance_reports_member_select` en la migración 0005).
 */
export async function getReports(clientId?: string): Promise<ReportWithClient[]> {
  const supabase = await createClient();
  let query = supabase
    .from("performance_reports")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) {
    console.error("[getReports]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const { clients, ...rest } = row as PerformanceReport & {
      clients: { name: string } | null;
    };
    return { ...rest, client_name: clients?.name ?? "—" };
  });
}
