import { describe, it, expect } from "vitest";
import { findModuleKeyForPath, ROUTE_MODULE_MAP } from "./module-route-map";
import { MODULES_CATALOG } from "./modules-catalog";

const CATALOG_KEYS = new Set(MODULES_CATALOG.flatMap((cat) => cat.modules.map((m) => m.key)));

describe("findModuleKeyForPath", () => {
  it("matchea un prefijo exacto", () => {
    expect(findModuleKeyForPath("/admin/tareas")).toBe("tareas");
  });

  it("matchea un sub-path del prefijo", () => {
    expect(findModuleKeyForPath("/admin/clientes/abc-123")).toBe("cuentas");
  });

  it("elige el prefijo MÁS ESPECÍFICO (más largo) cuando hay varios candidatos", () => {
    // /admin/analytics/dashboards tiene que ganarle a /admin/analytics (genérico).
    expect(findModuleKeyForPath("/admin/analytics/dashboards")).toBe("analytics-dashboards");
    expect(findModuleKeyForPath("/admin/analytics/explorer")).toBe("analytics-explorer");
    expect(findModuleKeyForPath("/admin/analytics")).toBe("analytics-overview");
    // Config general vs los sub-paths específicos de configuración.
    expect(findModuleKeyForPath("/admin/configuracion/auditoria")).toBe("config-auditoria");
    expect(findModuleKeyForPath("/admin/configuracion")).toBe("config-general");
  });

  it("no matchea por substring sin separador de path (evita falsos positivos)", () => {
    // Un path que empieza igual pero no en un límite de carpeta no debe matchear.
    expect(findModuleKeyForPath("/admin/analyticsFOO")).not.toBe("analytics-overview");
  });

  it("devuelve null para paths sin ningún módulo asociado (ej. Dashboard)", () => {
    expect(findModuleKeyForPath("/admin")).toBeNull();
    expect(findModuleKeyForPath("/algo/que/no/existe")).toBeNull();
  });

  it("cada key de ROUTE_MODULE_MAP existe en MODULES_CATALOG (sin entradas huérfanas)", () => {
    for (const entry of ROUTE_MODULE_MAP) {
      expect(CATALOG_KEYS.has(entry.key), `"${entry.key}" (${entry.prefix}) no está en MODULES_CATALOG`).toBe(
        true
      );
    }
  });
});
