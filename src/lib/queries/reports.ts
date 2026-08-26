import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PerformanceReport, ReportStatus } from "@/types/database";

export interface ReportWithClient extends PerformanceReport {
  client_name: string;
}

export interface ReportFilters {
  clientId?: string;
  status?: ReportStatus;
  /** Búsqueda libre (contains, case-insensitive) sobre period_label. */
  period?: string;
}

/**
 * Lista reportes, con filtros opcionales por cliente/estado/período (Fase
 * 2.1 — equivalente a los filtros de Analytics > Reports en MB Suite). RLS
 * acota además: admin ve todos (borrador y publicados); el cliente solo ve
 * los suyos con status='published' (ver policy
 * `performance_reports_member_select` en la migración 0005).
 */
export async function getReports(
  filters: ReportFilters = {},
  limit = 300
): Promise<ReportWithClient[]> {
  const supabase = await createClient();
  let query = supabase
    .from("performance_reports")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.period) query = query.ilike("period_label", `%${filters.period}%`);

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
