import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { DICTIONARIES } from "./dictionary";

/**
 * Recorre src/app buscando todo `t("algo.con.puntos", "fallback")` y
 * confirma que la clave exista de verdad en el diccionario — sin esto, un
 * typo en una clave nueva (ej. "pages.clienteDetail.tabBiling") no rompe
 * nada visualmente (el fallback en español se sigue mostrando), así que
 * pasa desapercibido para siempre. Es el mismo espíritu que check-rules.mjs,
 * pero para i18n en vez de las convenciones del repo.
 */
function collectLeafPaths(node: unknown, prefix = ""): Set<string> {
  const out = new Set<string>();
  if (typeof node === "string") {
    out.add(prefix);
    return out;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      for (const p of collectLeafPaths(value, prefix ? `${prefix}.${key}` : key)) out.add(p);
    }
  }
  return out;
}

function findTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...findTsxFiles(full));
    else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

const APP_DIR = join(__dirname, "..", "..", "app");
const CALL_PATTERN = /\bt\(\s*"([a-zA-Z0-9_.]+)"/g;

describe("t(...) usage in src/app resolves to real dictionary keys", () => {
  const validPaths = collectLeafPaths(DICTIONARIES.es);
  const files = findTsxFiles(APP_DIR);

  const usages: { file: string; key: string }[] = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(CALL_PATTERN)) {
      usages.push({ file, key: match[1] });
    }
  }

  it("encontró al menos algunas llamadas a t(...) (si esto da 0, el regex/paths se rompió)", () => {
    expect(usages.length).toBeGreaterThan(20);
  });

  it("cada clave usada existe en el diccionario", () => {
    const missing = usages.filter((u) => !validPaths.has(u.key));
    const detail = missing.map((m) => `${m.key} (${m.file.replace(APP_DIR, "src/app")})`).join("\n");
    expect(missing, `Claves usadas en código que no existen en el diccionario:\n${detail}`).toEqual([]);
  });
});
