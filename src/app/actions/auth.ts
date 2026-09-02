"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import {
  CACHE_COOKIE,
  ROLE_CACHE_COOKIE_OPTIONS,
  buildRoleCache,
  resolveRoleAndFlagsFromDb,
} from "@/lib/role-cache";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// `role` va SOLO en la respuesta ok:true, y solo sirve para que el cliente
// salte directo a "/admin"|"/editor"|"/client" en vez de pasar por
// "/dashboard" (que igual termina redirigiendo ahí, ver proxy.ts) — un viaje
// de ida y vuelta al server + otra pasada de middleware que hoy se paga en
// TODOS los logins y es buena parte de la demora reportada ("tarda en
// entrar"). Si no se pudo resolver el rol por algún motivo, se cae a null y
// el cliente sigue yendo a "/dashboard" como antes (nunca rompe el login).
//
// `mfaFactorId` viene puesto solo si la cuenta tiene 2FA verificado y hace
// falta un segundo paso — se resuelve ACÁ (server) en vez de que
// login-form.tsx le pregunte a Supabase Auth desde el browser después de
// recibir esta respuesta, que era un viaje de ida y vuelta más en TODOS los
// logins (el 99% sin 2FA incluido) solo para enterarse de que no hacía falta.
export type LoginResult =
  | { ok: true; role: string | null; mfaFactorId?: string }
  | { ok: false; error: string };

/**
 * Login server-side (reemplaza el `supabase.auth.signInWithPassword` que
 * antes se llamaba directo desde el cliente en `login-form.tsx`). El motivo
 * del cambio es exclusivamente de seguridad: acá adentro se puede rate-
 * limitar el intento (por IP y por email+IP) ANTES de gastar un intento
 * real contra Supabase Auth, con bloqueo automático temporal si alguien
 * está probando fuerza bruta — algo que no se puede hacer si el login pasa
 * directo del browser a Supabase. El resto del comportamiento es idéntico:
 * mismo `signInWithPassword`, mismo cliente SSR que ya deja la sesión en
 * cookies (Server Actions sí pueden escribirlas).
 */
export async function loginAction(formData: FormData): Promise<LoginResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Email o contraseña incorrectos." };
  }

  const supabase = await createSupabaseServerClient();
  const ip = await getClientIp();

  // Doble ventana: por IP sola (frena a alguien probando muchos emails
  // distintos desde la misma máquina) y por email+IP (frena fuerza bruta
  // sobre una cuenta puntual sin afectar a otros usuarios de la misma red).
  // En paralelo (antes era secuencial: 2 round-trips a la base uno atrás del
  // otro solo para el caso común de login válido, donde los dos SIEMPRE
  // terminan pasando) — mismo chequeo, misma cuenta de intentos en los dos
  // casos, nada más rápido para el 99% de los logins que sí son válidos.
  const [ipAllowed, emailAllowed] = await Promise.all([
    checkRateLimit(supabase, `login:ip:${ip}`, {
      maxHits: 20,
      windowSeconds: 15 * 60,
      blockMinutes: 30,
    }),
    checkRateLimit(supabase, `login:email:${parsed.data.email.toLowerCase()}:${ip}`, {
      maxHits: 5,
      windowSeconds: 15 * 60,
      blockMinutes: 30,
    }),
  ]);
  if (!ipAllowed || !emailAllowed) {
    return { ok: false, error: "Demasiados intentos de inicio de sesión. Esperá unos minutos e intentá de nuevo." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { ok: false, error: "Email o contraseña incorrectos." };
  }

  // Registra el inicio de sesión en Auditoría Y le avisa al usuario por la
  // campana de notificaciones (0034_login_security_notifications.sql — el
  // switch "Alertas de Seguridad" de Mi Perfil, antes sin nada atrás). A
  // propósito sin `await`: es un "best effort" que nunca debe demorar ni
  // romper un login que ya fue exitoso — si la RPC falla, solo se loguea acá.
  supabase.rpc("log_login_event", { p_ip: ip }).then(({ error: logError }) => {
    if (logError) console.error("[log_login_event]", logError.message);
  });

  // Todo lo que sigue depende solo de la sesión ya creada por
  // signInWithPassword, así que corre EN PARALELO (antes eran 2-3 vueltas
  // seguidas: rol, y aparte — ya en el browser — el chequeo de 2FA):
  // - rol + module_flags (con overrides de cliente), para navegar directo a
  //   la home del rol Y para pre-calentar la cookie de cache que lee
  //   proxy.ts (mac_rc) — así el primer request post-login (esa misma
  //   navegación) encuentra la cookie puesta y no repite estas consultas.
  // - nivel de verificación (AAL): si la cuenta tiene 2FA verificado,
  //   Supabase exige un segundo factor antes de que la sesión sirva para
  //   algo — antes esto se chequeaba desde login-form.tsx con un round-trip
  //   extra directo del browser a Supabase Auth, en TODOS los logins.
  const [{ role, flags }, { data: aal }] = await Promise.all([
    resolveRoleAndFlagsFromDb(supabase, data.user.id),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  // listFactors() solo hace falta para el subconjunto de cuentas con 2FA
  // verificado (poquísimas, está apagado por defecto) — no vale la pena
  // sumarlo al Promise.all de arriba para todo el mundo.
  let mfaFactorId: string | undefined;
  if (aal && aal.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    mfaFactorId = factors?.totp.find((f) => f.status === "verified")?.id;
  }

  if (role) {
    const cookieStore = await cookies();
    cookieStore.set(
      CACHE_COOKIE,
      JSON.stringify(buildRoleCache(data.user.id, role, flags)),
      ROLE_CACHE_COOKIE_OPTIONS
    );
  }

  return { ok: true, role, mfaFactorId };
}

const resetRequestSchema = z.object({ email: z.string().email() });

export type RequestPasswordResetResult = { ok: true } | { ok: false; error: string };

/**
 * "¿Olvidaste tu contraseña?" — dispara el email de recuperación de Supabase
 * Auth (mismo mecanismo de envío que la invitación de alta de Cliente/Editor,
 * ver lib/onboarding.ts). SIEMPRE devuelve éxito genérico, exista o no una
 * cuenta con ese email — no filtramos qué emails están registrados.
 * El link del mail vuelve a /auth/callback, que intercambia el código por
 * una sesión real y de ahí manda a /auth/actualizar-password.
 */
export async function requestPasswordResetAction(
  formData: FormData
): Promise<RequestPasswordResetResult> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: "Ingresá un email válido." };
  }

  const supabase = await createSupabaseServerClient();
  const ip = await getClientIp();

  // Mismo criterio anti-abuso que el login: no dejar que alguien use este
  // formulario para bombardear de mails a una cuenta ajena.
  const allowed = await checkRateLimit(supabase, `password-reset:${parsed.data.email.toLowerCase()}:${ip}`, {
    maxHits: 3,
    windowSeconds: 15 * 60,
    blockMinutes: 30,
  });
  if (!allowed) {
    return { ok: false, error: "Demasiados pedidos. Esperá unos minutos e intentá de nuevo." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/actualizar-password`,
  });

  // No propagamos el error al cliente a propósito (por diseño no revelamos
  // si el email existe o no) — solo lo logueamos para poder debuggear nosotros.
  if (error) console.error("[requestPasswordResetAction]", error.message);

  return { ok: true };
}
