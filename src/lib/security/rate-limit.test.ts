import { describe, it, expect } from "vitest";
import { computeFixedWindowHitCount } from "./window";

/**
 * Misma regla de "ventana fija" que implementa `check_rate_limit()` en
 * Postgres (0027_security_hardening.sql) — ver el comentario de
 * `computeFixedWindowHitCount` sobre por qué existe esta versión pura.
 */
describe("computeFixedWindowHitCount", () => {
  const windowSeconds = 60;

  it("incrementa el contador dentro de la misma ventana", () => {
    const t0 = 1_000_000;
    const result = computeFixedWindowHitCount(t0, 3, t0 + 10_000, windowSeconds);
    expect(result).toEqual({ windowStartMs: t0, hitCount: 4 });
  });

  it("resetea el contador a 1 cuando la ventana ya expiró", () => {
    const t0 = 1_000_000;
    const now = t0 + windowSeconds * 1000 + 1;
    const result = computeFixedWindowHitCount(t0, 10, now, windowSeconds);
    expect(result).toEqual({ windowStartMs: now, hitCount: 1 });
  });

  it("el límite exacto de la ventana todavía cuenta como vigente (no expirada)", () => {
    const t0 = 1_000_000;
    const now = t0 + windowSeconds * 1000; // exactamente en el borde, no lo pasa
    const result = computeFixedWindowHitCount(t0, 5, now, windowSeconds);
    expect(result).toEqual({ windowStartMs: t0, hitCount: 6 });
  });
});
