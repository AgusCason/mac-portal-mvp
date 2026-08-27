import { describe, it, expect } from "vitest";
import { MODULES_CATALOG, countModulesByStatus, totalModulesCount } from "./modules-catalog";

describe("MODULES_CATALOG", () => {
  it("no tiene keys duplicadas entre categorías", () => {
    const keys = MODULES_CATALOG.flatMap((cat) => cat.modules.map((m) => m.key));
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it("totalModulesCount() coincide con la cuenta real", () => {
    const actual = MODULES_CATALOG.reduce((sum, cat) => sum + cat.modules.length, 0);
    expect(totalModulesCount()).toBe(actual);
  });

  it("countModulesByStatus() suma exactamente totalModulesCount() entre los dos estados posibles", () => {
    const incluido = countModulesByStatus("incluido");
    const proximamente = countModulesByStatus("proximamente");
    expect(incluido + proximamente).toBe(totalModulesCount());
  });
});
