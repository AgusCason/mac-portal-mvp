import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Overrides de acceso al Portal de Clientes de UN cliente puntual — capa
 * fina sobre module_flags (que sigue siendo el on/off general, ver
 * Configuración > Módulos). Sin fila para una key = "como agencia" (hereda
 * el `visible_to_client` general) — ver mergeClientOverrides() en
 * module-visibility.ts.
 */
export async function getClientModuleOverrides(clientId: string): Promise<Record<string, boolean>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_module_overrides")
    .select("module_key, visible")
    .eq("client_id", clientId);
  if (error) {
    console.error("[getClientModuleOverrides]", error.message);
    return {};
  }
  return Object.fromEntries((data ?? []).map((row) => [row.module_key, row.visible]));
}
