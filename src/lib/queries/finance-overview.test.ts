import { describe, it, expect } from "vitest";
import { computeToolsCostOverview } from "@/lib/finance-utils";
import type { AgencyToolWithAccess } from "./tools";

function tool(overrides: Partial<AgencyToolWithAccess>): AgencyToolWithAccess {
  return {
    id: "id",
    name: "Tool",
    purpose: null,
    url: null,
    account_email: null,
    notes: null,
    cost_amount: null,
    cost_currency: "ARS",
    cost_frequency: null,
    next_renewal_date: null,
    created_by: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    hasPassword: false,
    sharedWith: [],
    ...overrides,
  };
}

describe("computeToolsCostOverview", () => {
  it("normaliza costos anuales a mensual y suma junto con los mensuales, por moneda", () => {
    const tools = [
      tool({ id: "1", cost_amount: 100, cost_currency: "USD", cost_frequency: "mensual" }),
      tool({ id: "2", cost_amount: 1200, cost_currency: "USD", cost_frequency: "anual" }),
      tool({ id: "3", cost_amount: 5000, cost_currency: "ARS", cost_frequency: "mensual" }),
    ];
    const result = computeToolsCostOverview(tools);
    const usd = result.byCurrency.find((c) => c.currency === "USD");
    const ars = result.byCurrency.find((c) => c.currency === "ARS");
    expect(usd?.monthlyEquivalent).toBe(200); // 100 + (1200/12)
    expect(ars?.monthlyEquivalent).toBe(5000);
  });

  it("no suma pagos únicos ni herramientas sin costo cargado al total recurrente", () => {
    const tools = [
      tool({ id: "1", cost_amount: 999, cost_currency: "ARS", cost_frequency: "unico" }),
      tool({ id: "2", cost_amount: null, cost_currency: "ARS", cost_frequency: null }),
    ];
    const result = computeToolsCostOverview(tools);
    expect(result.byCurrency).toHaveLength(0);
  });

  it("ordena los vencimientos por fecha más próxima primero", () => {
    const tools = [
      tool({ id: "1", name: "Later", next_renewal_date: "2026-12-01" }),
      tool({ id: "2", name: "Sooner", next_renewal_date: "2026-09-01" }),
    ];
    const result = computeToolsCostOverview(tools);
    expect(result.renewals.map((r) => r.name)).toEqual(["Sooner", "Later"]);
  });

  it("no incluye en `renewals` a las herramientas sin fecha de vencimiento", () => {
    const tools = [tool({ id: "1", next_renewal_date: null })];
    const result = computeToolsCostOverview(tools);
    expect(result.renewals).toHaveLength(0);
  });
});
