import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AuditLogEntry } from "@/types/database";

export interface AuditLogEntryWithRelations extends AuditLogEntry {
  actor_name: string | null;
  client_name: string | null;
}

/**
 * Configuración > Auditoría — únicamente admin (RLS: `audit_log_admin_select`
 * en 0026_audit_log.sql). Se llena sola vía triggers/funciones, nunca desde
 * un Server Action de la app.
 */
export async function getAuditLog(limit = 300): Promise<AuditLogEntryWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*, profiles(full_name, email), clients(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

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
