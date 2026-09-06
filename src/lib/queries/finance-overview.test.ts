import { describe, it, expect } from "vitest";
import { computeToolsCostOverview, computeEditorPayoutsMonthly } from "@/lib/finance-utils";
import type { AgencyToolWithAccess } from "./tools";
import type { EditorPayout } from "@/types/database";

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

  it("arma `topTools` (ranking por costo mensual, de mayor a menor) por moneda", () => {
    const tools = [
      tool({ id: "1", name: "Chica", cost_amount: 50, cost_currency: "USD", cost_frequency: "mensual" }),
      tool({ id: "2", name: "Grande", cost_amount: 1200, cost_currency: "USD", cost_frequency: "anual" }), // -> 100/mes
      tool({ id: "3", name: "Única", cost_amount: 999, cost_currency: "USD", cost_frequency: "unico" }), // no entra
    ];
    const result = computeToolsCostOverview(tools);
    const usd = result.byCurrency.find((c) => c.currency === "USD");
    expect(usd?.topTools.map((t) => t.name)).toEqual(["Grande", "Chica"]);
    expect(usd?.topTools.map((t) => t.monthlyEquivalent)).toEqual([100, 50]);
  });
});

/** Fecha (YYYY-MM-DD) del primer día del mes, `monthsAgo` meses antes del actual — para anclar fixtures a la ventana móvil de `computeEditorPayoutsMonthly`. */
function isoFirstOfMonth(monthsAgo: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toISOString().slice(0, 10);
}

function payout(overrides: Partial<EditorPayout>): EditorPayout {
  return {
    id: "id",
    editor_id: "editor-1",
    client_id: null,
    amount: 1000,
    currency: "ARS",
    method: null,
    status: "pagado",
    period_label: null,
    due_date: isoFirstOfMonth(0),
    paid_at: isoFirstOfMonth(0),
    notes: null,
    created_by: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeEditorPayoutsMonthly", () => {
  it("cuenta lo pagado en el mes de `paid_at` y lo pendiente en el mes de `due_date`, por moneda", () => {
    const payouts = [
      payout({ id: "1", status: "pagado", amount: 500, paid_at: isoFirstOfMonth(0), due_date: isoFirstOfMonth(1) }),
      payout({ id: "2", status: "pendiente", amount: 300, paid_at: null, due_date: isoFirstOfMonth(0) }),
    ];
    const result = computeEditorPayoutsMonthly(payouts, 6);
    const ars = result.find((r) => r.currency === "ARS");
    const currentMonth = ars?.monthly[ars.monthly.length - 1];
    expect(currentMonth?.paid).toBe(500);
    expect(currentMonth?.pending).toBe(300);
  });

  it("no mezcla monedas distintas entre sí", () => {
    const payouts = [
      payout({ id: "1", currency: "ARS", amount: 1000 }),
      payout({ id: "2", currency: "USD", amount: 200 }),
    ];
    const result = computeEditorPayoutsMonthly(payouts, 6);
    expect(result.map((r) => r.currency).sort()).toEqual(["ARS", "USD"]);
  });

  it("devuelve exactamente `monthsBack` puntos, del más viejo al más nuevo", () => {
    const result = computeEditorPayoutsMonthly([payout({})], 6);
    const ars = result.find((r) => r.currency === "ARS")!;
    expect(ars.monthly).toHaveLength(6);
    expect(ars.monthly[ars.monthly.length - 1].month).toBe(isoFirstOfMonth(0).slice(0, 7));
  });

  it("un pago pendiente sin `paid_at` no suma como pagado aunque esté vencido", () => {
    const payouts = [payout({ status: "pendiente", amount: 777, paid_at: null, due_date: isoFirstOfMonth(0) })];
    const result = computeEditorPayoutsMonthly(payouts, 6);
    const ars = result.find((r) => r.currency === "ARS")!;
    const currentMonth = ars.monthly[ars.monthly.length - 1];
    expect(currentMonth.paid).toBe(0);
    expect(currentMonth.pending).toBe(777);
  });
});
