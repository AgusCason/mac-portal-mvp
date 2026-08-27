import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AuditLogEntry } from "@/types/database";

export interface AuditLogEntryWithRelations extends AuditLogEntry {
  actor_name: string | null;
  client_name: string | null;
}

export interface AuditLogFilters {
  limit?: number;
  /** Fecha "yyyy-mm-dd" inclusive, en hora local del servidor. */
  dateFrom?: string;
  /** Fecha "yyyy-mm-dd" inclusive. */
  dateTo?: string;
  actionType?: string;
}

/**
 * Configuración > Auditoría — únicamente admin (RLS: `audit_log_admin_select`
 * en 0026_audit_log.sql). Se llena sola vía triggers/funciones, nunca desde
 * un Server Action de la app. Los filtros son opcionales (por defecto trae
 * las últimas 300 sin filtrar, igual que antes) — `idx_audit_log_action_type`
 * (0027_security_hardening.sql) sostiene el filtro por tipo de acción.
 */
export async function getAuditLog(filters: AuditLogFilters = {}): Promise<AuditLogEntryWithRelations[]> {
  const { limit = 300, dateFrom, dateTo, actionType } = filters;
  const supabase = await createClient();
  let query = supabase
    .from("audit_log")
    .select("*, profiles(full_name, email), clients(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);
  if (actionType) query = query.eq("action_type", actionType);

  const { data, error } = await query;

  if (error) {
    console.error("[getAuditLog]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const typed = row as unknown as AuditLogEntry & {
      profiles: { full_name: string; email: string } | null;
      clients: { name: string } | null;
    };
    const { profiles, clients, ...rest } = typed;
    return {
      ...rest,
      actor_name: profiles?.full_name || profiles?.email || null,
      client_name: clients?.name ?? null,
    };
  });
}
