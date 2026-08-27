/**
 * Ventana fija (fixed window) — misma lógica que `check_rate_limit()` en
 * Postgres (0027_security_hardening.sql), extraída acá como función pura
 * (sin `server-only`, sin I/O) para poder testearla sin una base de datos
 * real — ver `src/lib/security/rate-limit.test.ts`. El código de producción
 * NO usa esto: la cuenta real vive en Postgres para ser atómica entre
 * invocaciones serverless concurrentes. Este archivo existe solo para poder
 * cubrir con un test unitario la misma regla que la migración implementa en
 * SQL, y detectar si alguna vez se desincronizan.
 */
export function computeFixedWindowHitCount(
  previousWindowStartMs: number,
  previousHitCount: number,
  nowMs: number,
  windowSeconds: number
): { windowStartMs: number; hitCount: number } {
  const windowExpired = nowMs - previousWindowStartMs > windowSeconds * 1000;
  if (windowExpired) {
    return { windowStartMs: nowMs, hitCount: 1 };
  }
  return { windowStartMs: previousWindowStartMs, hitCount: previousHitCount + 1 };
}
