import "server-only";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
export { computeFixedWindowHitCount } from "./window";

/**
 * Extrae la IP del visitante desde los headers de proxy, para usarla en la
 * `key` del rate limiter. Pensado para Server Actions (usa `headers()` de
 * `next/headers`, que ya tiene acceso al request en curso). Netlify manda
 * `x-nf-client-connection-ip`; como fallback se usa el primer valor de
 * `x-forwarded-for` (headers estándar de cualquier proxy/CDN delante).
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const direct = h.get("x-nf-client-connection-ip");
  if (direct) return direct;
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "unknown";
}

/** Misma extracción que `getClientIp()`, para Route Handlers que ya tienen el `Request` a mano. */
export function getClientIpFromRequest(request: Request): string {
  const direct = request.headers.get("x-nf-client-connection-ip");
  if (direct) return direct;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "unknown";
}

export interface RateLimitOptions {
  /** Máximo de intentos permitidos dentro de la ventana. */
  maxHits: number;
  /** Duración de la ventana, en segundos. */
  windowSeconds: number;
  /** Cuánto dura el bloqueo automático si se supera el máximo (minutos). Default 30. */
  blockMinutes?: number;
}

/**
 * Chequea + cuenta un intento contra `public.check_rate_limit` (Postgres —
 * ver 0027_security_hardening.sql). Devuelve `true` si está permitido,
 * `false` si hay que rechazar (rate limit superado, o la key ya está en un
 * bloqueo automático vigente). El contador y el bloqueo temporal viven en la
 * base, no en memoria del proceso — necesario porque cada invocación
 * serverless (Netlify Function/Server Action) es stateless entre sí.
 *
 * Recibe el cliente de Supabase ya creado por el caller (el de sesión normal
 * en Server Actions, o el de Service Role en el webhook) para no forzar una
 * segunda conexión ni depender de cookies en contextos que no las tienen.
 *
 * Si el chequeo mismo falla (ej. la migración todavía no corrió), se
 * permite el request — un rate limiter roto nunca debe tumbar la
 * funcionalidad real que protege.
 */
export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  key: string,
  opts: RateLimitOptions
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_max_hits: opts.maxHits,
      p_window_seconds: opts.windowSeconds,
      p_block_minutes: opts.blockMinutes ?? 30,
    });
    if (error) {
      console.error("[checkRateLimit]", error.message);
      return true;
    }
    return Boolean(data);
  } catch (err) {
    console.error("[checkRateLimit]", err instanceof Error ? err.message : err);
    return true;
  }
}
