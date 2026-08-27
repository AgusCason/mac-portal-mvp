import { describe, it, expect } from "vitest";
import { NAV_CONFIG } from "./nav-config";
import { findModuleKeyForPath } from "./module-route-map";
import { MODULES_CATALOG } from "./modules-catalog";

const CATALOG_KEYS = new Set(MODULES_CATALOG.flatMap((cat) => cat.modules.map((m) => m.key)));

function collectHrefs(): string[] {
  const hrefs: string[] = [];
  for (const items of Object.values(NAV_CONFIG)) {
    for (const item of items) {
      if (item.href) hrefs.push(item.href);
      for (const child of item.children ?? []) hrefs.push(child.href);
    }
  }
  return hrefs;
}

describe("NAV_CONFIG <-> module-route-map", () => {
  it("todo href de NAV_CONFIG, si matchea un módulo, apunta a uno que existe en el catálogo", () => {
    for (const href of collectHrefs()) {
      const key = findModuleKeyForPath(href);
      if (key === null) continue; // ítem intencionalmente sin gating (ej. Dashboard)
      expect(CATALOG_KEYS.has(key), `${href} -> "${key}" no está en MODULES_CATALOG`).toBe(true);
    }
  });
});
