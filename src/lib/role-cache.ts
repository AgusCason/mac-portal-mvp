import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/types/database";
import { mergeClientOverrides } from "@/lib/module-visibility";

/** Solo lo que `isModuleVisible` necesita — la cookie de cache no carga
 *  `updated_at`/`updated_by` de las 18 filas de `module_flags`. */
export interface FlagSlim {
  enabled: boolean;
  visible_to_editor: boolean;
  visible_to_client: boolean;
}

export const CACHE_COOKIE = "mac_rc";
export const CACHE_TTL_MS = 30_000;

export interface RoleCache {
  uid: string;
  role: UserRole;
  flags: Record<string, FlagSlim>;
  ts: number;
}

/**
 * Resuelve `role` + `module_flags` (con overrides de cliente ya aplicados)
 * consultando la base directo, sin pasar por la cookie de cache — quien
 * llama decide si el resultado se cachea o no.
 *
 * Dos consumidores:
 * - `proxy.ts`, en un cache-miss de `mac_rc`.
 * - `loginAction` (src/app/actions/auth.ts), para PRE-calentar esa misma
 *   cookie en el momento del login — así el primer request post-login (la
 *   navegación a la home del rol) encuentra la cookie ya puesta y no vuelve
 *   a pagar estas mismas consultas una segunda vez en frío.
 */
export async function resolveRoleAndFlagsFromDb(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ role: UserRole | null; flags: Record<string, FlagSlim> }> {
  const [{ data: profile }, { data: flagRows }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).single(),
    supabase.from("module_flags").select("key, enabled, visible_to_editor, visible_to_client"),
  ]);

  const role = (profile?.role as UserRole | undefined) ?? null;
  let flags = Object.fromEntries(
    (flagRows ?? []).map((f) => [
      f.key,
      { enabled: f.enabled, visible_to_editor: f.visible_to_editor, visible_to_client: f.visible_to_client },
    ])
  );

  // Acceso por cliente puntual (client_module_overrides) — capa fina sobre
  // el `visible_to_client` general, ver ficha de cliente > pestaña Accesos.
  // Solo aplica al rol "client"; admin/editor no tienen client_id propio.
  if (role === "client") {
    const { data: memberRow } = await supabase
      .from("client_members")
      .select("client_id")
      .eq("profile_id", userId)
      .limit(1)
      .maybeSingle();
    if (memberRow?.client_id) {
      const { data: overrideRows } = await supabase
        .from("client_module_overrides")
        .select("module_key, visible")
        .eq("client_id", memberRow.client_id);
      const overrides = Object.fromEntries(
        (overrideRows ?? []).map((o) => [o.module_key, o.visible])
      );
      flags = mergeClientOverrides(flags, overrides);
    }
  }

  return { role, flags };
}

export function buildRoleCache(
  uid: string,
  role: UserRole,
  flags: Record<string, FlagSlim>
): RoleCache {
  return { uid, role, flags, ts: Date.now() };
}

/** Opciones de cookie compartidas por `proxy.ts` y `loginAction` — deben ser idénticas para que uno pueda leer lo que el otro escribió. */
export const ROLE_CACHE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60,
};
