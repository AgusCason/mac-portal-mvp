import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ModuleFlag } from "@/types/database";

/**
 * Estado real de on/off por módulo — clave = `ModuleEntry.key` de
 * modules-catalog.ts. Cualquier autenticado puede leerlo (RLS lo permite):
 * lo usan tanto el panel del admin como el filtro de sidebar de cada rol
 * (app-shell.tsx) y el guard de rutas (proxy.ts / lib/module-guard.ts).
 */
export async function getModuleFlags(): Promise<Record<string, ModuleFlag>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("module_flags").select("*");
  if (error) {
    console.error("[getModuleFlags]", error.message);
    return {};
  }
  return Object.fromEntries((data ?? []).map((row) => [row.key, row as ModuleFlag]));
}
