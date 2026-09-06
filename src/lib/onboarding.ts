import "server-only";
import { randomInt } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { UserRole } from "@/types/database";

export interface InviteOk {
  ok: true;
  profileId: string;
  alreadyExisted: boolean;
  // Presente (siempre `undefined` acá) solo para que este tipo comparta
  // forma con `CreateWithPasswordOk` — así el caller (`createEditorAction`)
  // puede leer `result.temporaryPassword` sin un type guard `"x" in result`
  // que TS no siempre estrecha bien sobre una unión de interfaces.
  temporaryPassword?: undefined;
}
export interface InviteError {
  ok: false;
  error: string;
}

export interface CreateWithPasswordOk {
  ok: true;
  profileId: string;
  alreadyExisted: boolean;
  /** Solo viene seteado cuando se creó una cuenta nueva de verdad — nunca
   * se regenera ni se puede volver a pedir, así que el caller la muestra
   * una sola vez. */
  temporaryPassword?: string;
}

/**
 * Busca el `profiles.id` de un email que ya tiene cuenta de Auth. Factorizado
 * de `inviteOrReuseUser` porque tanto invitar por email como crear con
 * contraseña directa pisan el mismo caso: el email ya existe, así que en vez
 * de fallar reutilizamos su perfil.
 */
async function findExistingProfileId(email: string): Promise<string | null> {
  const rls = await createSupabaseServerClient();
  const { data: existing } = await rls.from("profiles").select("id").eq("email", email).maybeSingle();
  return existing?.id ?? null;
}

const PASSWORD_CHARS_LETTERS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const PASSWORD_CHARS_DIGITS = "23456789";
const PASSWORD_CHARS_ALL = PASSWORD_CHARS_LETTERS + PASSWORD_CHARS_DIGITS;

/**
 * Contraseña temporal random para el alta "directa" (sin email). Evita
 * caracteres ambiguos (0/O, 1/l/I) porque el admin normalmente la va a
 * transcribir a mano o leerla en voz alta al editor. Garantiza al menos una
 * letra y un número por construcción (no al azar) para cumplir siempre
 * `getPasswordStrengthError` — con `crypto.randomInt`, no `Math.random`.
 */
function generateTemporaryPassword(length = 12): string {
  const pick = (charset: string) => charset[randomInt(charset.length)];
  const chars = [pick(PASSWORD_CHARS_LETTERS), pick(PASSWORD_CHARS_DIGITS)];
  while (chars.length < length) chars.push(pick(PASSWORD_CHARS_ALL));
  // Fisher-Yates con crypto.randomInt para no dejar los dos primeros
  // caracteres en una posición predecible.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
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
  // Defensa en profundidad: hoy los dos callers (alta de Cliente/Editor)
  // ya validan `requireAdmin()` antes de llegar acá, pero esta función usa
  // la Service Role Key (bypassea RLS por completo e invita usuarios con
  // cualquier rol) — no debería depender solo de que TODO futuro caller se
  // acuerde de chequear el rol antes de llamarla. Mismo patrón que
  // `requireRole()` en layouts + páginas: cada punto que toca algo
  // sensible valida por su cuenta, aunque sea redundante.
  await requireAdmin();
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
  const existingId = await findExistingProfileId(email);
  if (!existingId) {
    return {
      ok: false,
      error: "Ya existe una cuenta de Auth con ese email, pero no se encontró su perfil.",
    };
  }
  return { ok: true, profileId: existingId, alreadyExisted: true };
}

/**
 * Alternativa a `inviteOrReuseUser` que NO depende de que llegue ningún
 * email: crea la cuenta de Auth ya confirmada (`email_confirm: true`) con
 * una contraseña temporal generada acá mismo, para que el admin se la pase
 * al editor por el canal que prefiera (WhatsApp, en persona, etc.) en vez de
 * depender del mailer de Supabase — pensado para cuando ese envío no es
 * confiable (rate limit del mailer por defecto, o SMTP propio sin
 * configurar todavía).
 *
 * Mismo trigger `handle_new_user` que `inviteOrReuseUser`: la fila de
 * `profiles` sale sola del `user_metadata`, así que el resultado final es
 * indistinguible de un alta por invitación una vez creada la cuenta.
 */
export async function createUserWithPassword(
  email: string,
  fullName: string,
  role: UserRole
): Promise<CreateWithPasswordOk | InviteError> {
  // Mismo criterio de defensa en profundidad que `inviteOrReuseUser`: esta
  // función también usa la Service Role Key.
  await requireAdmin();
  const admin = createServiceRoleClient();

  const temporaryPassword = generateTemporaryPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (!error && data?.user) {
    return { ok: true, profileId: data.user.id, alreadyExisted: false, temporaryPassword };
  }

  const alreadyRegistered = /already|existe|registered/i.test(error?.message ?? "");
  if (!alreadyRegistered) {
    return { ok: false, error: error?.message ?? "No se pudo crear el usuario." };
  }

  // Ya existe una cuenta con ese email — no le pisamos la contraseña sin
  // que el admin lo pida explícitamente (podría ser la cuenta de otra
  // persona, o un editor que ya inició sesión antes). Mismo comportamiento
  // que `inviteOrReuseUser`: reutilizamos el perfil, sin contraseña nueva.
  const existingId = await findExistingProfileId(email);
  if (!existingId) {
    return {
      ok: false,
      error: "Ya existe una cuenta de Auth con ese email, pero no se encontró su perfil.",
    };
  }
  return { ok: true, profileId: existingId, alreadyExisted: true };
}
