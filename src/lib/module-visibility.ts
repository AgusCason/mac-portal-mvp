import type { ModuleFlag, UserRole } from "@/types/database";

/**
 * `enabled=false` es kill-switch: apaga el módulo para todos los roles,
 * admin incluido. `visible_to_editor`/`visible_to_client` solo importan
 * para esos roles — admin siempre ve lo que esté `enabled`. Un módulo sin
 * flag cargado (no está en module_flags, ej. todavía no migrado) nunca
 * bloquea nada — el gating es 100% opt-out.
 */
export function isModuleVisible(flag: ModuleFlag | undefined, role: UserRole): boolean {
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (role === "editor") return flag.visible_to_editor;
  if (role === "client") return flag.visible_to_client;
  return true;
}
