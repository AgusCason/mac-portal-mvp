import type { ModuleFlag, UserRole } from "@/types/database";

/**
 * `enabled=false` es kill-switch: apaga el módulo para todos los roles,
 * admin incluido. `visible_to_editor`/`visible_to_client` solo importan
 * para esos roles — admin siempre ve lo que esté `enabled`. Un módulo sin
 * flag cargado (no está en module_flags, ej. todavía no migrado) nunca
 * bloquea nada — el gating es 100% opt-out.
 */
type FlagVisibility = Pick<ModuleFlag, "enabled" | "visible_to_editor" | "visible_to_client">;

export function isModuleVisible(flag: FlagVisibility | undefined, role: UserRole): boolean {
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (role === "editor") return flag.visible_to_editor;
  if (role === "client") return flag.visible_to_client;
  return true;
}

/**
 * Aplica los overrides de acceso por cliente (client_module_overrides) sobre
 * el `visible_to_client` general de module_flags — capa fina para un cliente
 * puntual, sin tocar Configuración > Módulos (que sigue siendo el general).
 * El kill-switch general (`enabled=false`) sigue ganando siempre: como
 * `isModuleVisible` lo chequea antes que nada, un override no puede reflotar
 * un módulo apagado para toda la plataforma. Genérico para reusarse tanto
 * con el `Record<string, ModuleFlag>` completo (sidebar) como con el
 * `FlagSlim` liviano de la cookie de proxy.ts.
 */
export function mergeClientOverrides<T extends { visible_to_client: boolean }>(
  flags: Record<string, T>,
  overrides: Record<string, boolean>
): Record<string, T> {
  if (Object.keys(overrides).length === 0) return flags;
  const merged: Record<string, T> = { ...flags };
  for (const [key, visible] of Object.entries(overrides)) {
    const base = merged[key];
    if (base) merged[key] = { ...base, visible_to_client: visible };
  }
  return merged;
}
