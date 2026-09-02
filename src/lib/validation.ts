import { z } from "zod";

/**
 * Validación compartida de teléfono — a diferencia del email (que Zod ya
 * valida bien con `.email()` en todos los formularios), no había NADA acá:
 * `phone: z.string().optional()` aceptaba cualquier string, letras incluidas.
 * No exigimos un formato exacto (los números reales varían mucho entre
 * países: "+54 9 11 1234-5678", "(011) 4444-5555", etc.) — solo que no
 * tenga letras ni caracteres raros, y que tenga una cantidad de dígitos
 * razonable para un teléfono real (6 a 15, rango que cubre el estándar
 * E.164 de principio a fin).
 */
const PHONE_CHARS = /^[0-9+()\-.\s]+$/;

export function isValidPhone(value: string): boolean {
  if (!PHONE_CHARS.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15;
}

/**
 * Teléfono opcional en todos los formularios que lo piden — vacío sigue
 * siendo válido, pero si se completa algo, tiene que tener forma de
 * teléfono real. Usar en vez de `z.string().optional()` en cualquier campo
 * de teléfono.
 */
export const optionalPhoneSchema = z
  .string()
  .optional()
  .refine((v) => !v || v.trim() === "" || isValidPhone(v.trim()), {
    message: "Ingresá un teléfono válido (solo números, espacios, +, - y paréntesis).",
  });

/**
 * Mismo criterio que `isValidPhone`, como `pattern` de HTML para que el
 * navegador ya bloquee el envío (con su propio globo de validación nativo)
 * antes de que el form llegue al server action — feedback inmediato, sin
 * viaje de red. El regex del server (`isValidPhone`) sigue siendo la fuente
 * de verdad real: esto es solo azúcar de UX en el cliente.
 *
 * OJO: "(", ")" y "-" SIN escapar dentro de esta clase de caracteres hacen
 * que Chrome directamente ignore el pattern (el campo queda "válido" pase lo
 * que pase) — confirmado a mano: `[0-9()]{6,20}` o `[0-9-]{6,20}` como
 * `pattern` de un <input> nunca marcan inválido ningún valor, ni siquiera
 * puras letras, aunque el mismo string SÍ funciona perfecto como RegExp de
 * JS normal (por eso `isValidPhone` de arriba, que usa un RegExp real, no
 * tiene este problema). Escapando "\(" "\)" "\-" el pattern nativo del
 * input ya valida bien — es la única combinación que probamos que funciona.
 */
export const PHONE_INPUT_PATTERN = "[0-9+\\(\\)\\-. ]{6,20}";

/**
 * Requisito mínimo de contraseña nueva (único punto donde se crea/cambia
 * hoy: /auth/actualizar-password, tanto para "olvidé mi contraseña" como
 * para el primer ingreso vía invitación). Antes solo se pedía length >= 8 —
 * eso deja pasar cosas como "aaaaaaaa". No pedimos mayúscula/símbolo (ya es
 * bastante fricción para un portal interno con pocos usuarios) pero sí que
 * combine letras y números, así se sale de "todo un mismo tipo de caracter".
 */
export function getPasswordStrengthError(password: string): string | null {
  if (password.length < 8) return "La contraseña tiene que tener al menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(password)) return "La contraseña tiene que incluir al menos una letra.";
  if (!/[0-9]/.test(password)) return "La contraseña tiene que incluir al menos un número.";
  return null;
}
