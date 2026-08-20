import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export interface InviteOk {
  ok: true;
  profileId: string;
  alreadyExisted: boolean;
}
export interface InviteError {
  ok: false;
  error: string;
}

/**
 * Invita a un usuario real por email (o reutiliza su cuenta si ya existía)
 * con un rol dado. Este es el corazón del "aprovisionamiento automático":
 *
 *  1. Llama a la Admin API de Supabase Auth (`auth.admin.inviteUserByEmail`)
 *     con la Service Role Key — SOLO acá, nunca desde código de UI — lo que
 *     dispara el email oficial de invitación con el link para setear
 *     contraseña.
 *  2. El trigger `handle_new_user` (ver supabase/migrations/0001_schema.sql)
 *     crea automáticamente la fila en `public.profiles` con el `role` que le
 *     pasamos acá en `user_metadata`, usando el mismo UUID de `auth.users`.
 *     No hace falta ningún insert manual a `profiles` — ya es atómico por
 *     construcción de la base.
 *
 * Si el email ya tiene una cuenta (admin reintentando un alta, o el mismo
 * email para otro rol), no fallamos: reutilizamos el `profile.id` existente
 * para que el flujo de alta de Cliente/Editor pueda seguir de largo.
 */
export async function inviteOrReuseUser(
  email: string,
  fullName: string,
  role: UserRole
): Promise<InviteOk | InviteError> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, role },
  });

  if (!error && data?.user) {
    return { ok: true, profileId: data.user.id, alreadyExisted: false };
  }

  const alreadyRegistered = /already|existe|registered/i.test(error?.message ?? "");
  if (!alreadyRegistered) {
    return { ok: false, error: error?.message ?? "No se pudo invitar al usuario." };
  }

  // Ya hay una cuenta con ese email: buscamos su profile (RLS-aware, el
  // caller ya es admin así que profiles_select_own_or_admin lo permite).
  const rls = await createSupabaseServerClient();
  const { data: existing } = await rls
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!existing) {
    return {
      ok: false,
      error: "Ya existe una cuenta de Auth con ese email, pero no se encontró su perfil.",
    };
  }
  return { ok: true, profileId: existing.id, alreadyExisted: true };
}
