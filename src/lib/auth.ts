import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";

/**
 * Devuelve el profile completo del usuario logueado, o null si no hay sesión.
 *
 * Envuelto en `cache()` de React: dentro de UNA misma navegación, el layout
 * de la sección (admin/client/editor) y la página que se está mostrando
 * llaman `requireRole()` cada uno por su lado (por diseño — cada Server
 * Component valida su propio acceso, ver comentario de `requireRole` abajo).
 * Sin este cache, eso significaba `auth.getUser()` + un SELECT a `profiles`
 * DOS veces por navegación (una del layout, otra de la página) además del
 * `getUser()` que ya hace el middleware — tres viajes de ida y vuelta a
 * Supabase Auth para exactamente el mismo usuario en la misma request. Con
 * `cache()`, la segunda llamada dentro de esa misma request devuelve la
 * promesa ya resuelta por la primera, sin pegarle de nuevo a la red — es una
 * dedupe por-request, no una cache entre requests/usuarios, así que no
 * afloja ningún chequeo de seguridad (cada navegación nueva sigue validando
 * de cero).
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ?? null;
});

/**
 * Exige que haya sesión y, opcionalmente, que el rol sea uno de los permitidos.
 * Redirige a /login o /no-autorizado si no se cumple. Usar al principio de
 * Server Components de página y de Server Actions sensibles.
 */
export async function requireRole(allowed?: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (allowed && !allowed.includes(profile.role)) redirect("/no-autorizado");
  return profile;
}

/** Azúcar sintáctica para Server Actions que solo puede ejecutar el admin. */
export async function requireAdmin(): Promise<Profile> {
  return requireRole(["admin"]);
}
