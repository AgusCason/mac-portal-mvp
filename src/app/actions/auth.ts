"use server";

import { z } from "zod";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginResult = { ok: true } | { ok: false; error: string };

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
  const ipAllowed = await checkRateLimit(supabase, `login:ip:${ip}`, {
    maxHits: 20,
    windowSeconds: 15 * 60,
    blockMinutes: 30,
  });
  if (!ipAllowed) {
    return { ok: false, error: "Demasiados intentos de inicio de sesión. Esperá unos minutos e intentá de nuevo." };
  }

  const emailAllowed = await checkRateLimit(supabase, `login:email:${parsed.data.email.toLowerCase()}:${ip}`, {
    maxHits: 5,
    windowSeconds: 15 * 60,
    blockMinutes: 30,
  });
  if (!emailAllowed) {
    return { ok: false, error: "Demasiados intentos de inicio de sesión. Esperá unos minutos e intentá de nuevo." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: "Email o contraseña incorrectos." };
  }

  return { ok: true };
}
