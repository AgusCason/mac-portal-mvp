import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";

/** Devuelve el profile completo del usuario logueado, o null si no hay sesión. */
export async function getCurrentProfile(): Promise<Profile | null> {
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
}

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
