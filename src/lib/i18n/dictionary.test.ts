import { describe, it, expect } from "vitest";
import { DICTIONARIES, translate } from "./dictionary";

/**
 * TypeScript ya obliga a `en` a tener la misma forma que `es` (`en: typeof
 * es`), pero eso es una garantía de tipos en tiempo de compilación — no
 * protege si alguien la deshabilita localmente, ni verifica que las hojas
 * tengan contenido real (una traducción vacía "" pasa el chequeo de tipos
 * igual). Este test recorre el árbol en runtime y confirma ambas cosas.
 */
function collectLeafPaths(node: unknown, prefix = ""): string[] {
  if (typeof node === "string") return [prefix];
  if (node && typeof node === "object") {
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
      collectLeafPaths(value, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [];
}

describe("i18n dictionary (es/en)", () => {
  const esPaths = collectLeafPaths(DICTIONARIES.es).sort();
  const enPaths = collectLeafPaths(DICTIONARIES.en).sort();

  it("tiene exactamente las mismas claves en es y en", () => {
    expect(enPaths).toEqual(esPaths);
  });

  it("ninguna traducción está vacía", () => {
    for (const locale of ["es", "en"] as const) {
      for (const path of esPaths) {
        const value = translate(locale, path, "__MISSING__");
        expect(value.trim(), `${locale}.${path} está vacío`).not.toBe("");
        expect(value, `${locale}.${path} no se encontró en el diccionario`).not.toBe("__MISSING__");
      }
    }
  });

  it("translate() cae al fallback si la clave no existe", () => {
    expect(translate("es", "esto.no.existe", "fallback")).toBe("fallback");
    expect(translate("es", "esto.no.existe")).toBe("esto.no.existe");
  });
});
