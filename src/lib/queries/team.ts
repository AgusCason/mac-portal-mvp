import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/** Todos los editores de la agencia (para /admin/equipo). */
export async function getEditors(limit = 300): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "editor")
    .order("full_name")
    .limit(limit);
  if (error) {
    console.error("[getEditors]", error.message);
    return [];
  }
  return data ?? [];
}

/** Personal de la agencia (admin + editor) — para asignar Tareas/Proyectos. */
export async function getAgencyStaff(limit = 300): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "editor"])
    .order("full_name")
    .limit(limit);
  if (error) {
    console.error("[getAgencyStaff]", error.message);
    return [];
  }
  return data ?? [];
}

export interface ProfileLite {
  id: string;
  full_name: string;
  email: string;
  role: Profile["role"];
}

/**
 * TODOS los usuarios (admin + editor + client) en su versión liviana — para
 * el selector de "Usuario" de Configuración > Auditoría: a diferencia de
 * `getAgencyStaff`, acá también entran los clientes, porque `audit_log`
 * puede tener acciones hechas por un cliente (ej. "avisó un pago" — ver
 * `report_invoice_payment` en 0026_audit_log.sql).
 */
export async function getAllProfilesLite(limit = 500): Promise<ProfileLite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("full_name")
    .limit(limit);
  if (error) {
    console.error("[getAllProfilesLite]", error.message);
    return [];
  }
  return data ?? [];
}
