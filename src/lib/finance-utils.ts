// NOTA: este archivo NO importa "server-only" a propósito — a diferencia de
// queries/finance-overview.ts (que sí lo hace, porque consulta la base),
// las funciones puras de acá abajo se testean con vitest, y "server-only"
// tira un error si se intenta importar fuera de un Server Component. El
// import de tipo de `AgencyToolWithAccess` de abajo es SOLO de tipo (`import
// type`), así que se borra en compilación y no arrastra ese guard.
import type { AgencyToolWithAccess } from "@/lib/queries/tools";
import type { ToolCostFrequency, EditorPayout } from "@/types/database";

/**
 * Urgencia de una fecha de vencimiento (renovación de herramienta, próximo
 * pago, etc.) — puramente derivada de hoy vs. la fecha, sin I/O. Los
 * umbrales son los mismos en toda la sección de Finanzas: vencido = ya pasó,
 * urgente = próximos 7 días, próximo = próximos 30 días.
 */
export type DateUrgency = "overdue" | "urgent" | "soon" | null;

export function getDateUrgency(dateStr: string | null | undefined): DateUrgency {
  if (!dateStr) return null;
  const date = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "urgent";
  if (diffDays <= 30) return "soon";
  return null;
}

/** Variant de Badge + clave/fallback de i18n por cada nivel de urgencia — compartido entre Herramientas y el dashboard de Finanzas. */
export const URGENCY_BADGE: Record<
  NonNullable<DateUrgency>,
  { variant: "destructive" | "warning" | "secondary"; key: string; fallback: string }
> = {
  overdue: { variant: "destructive", key: "components.tools.renewalOverdue", fallback: "Vencida" },
  urgent: { variant: "warning", key: "components.tools.renewalUrgent", fallback: "Vence pronto" },
  soon: { variant: "secondary", key: "components.tools.renewalSoon", fallback: "Próxima" },
};

export interface ToolCostBreakdownRow {
  toolId: string;
  name: string;
  /** Costo recurrente normalizado a "por mes" — mismo cálculo que `monthlyEquivalent`. */
  monthlyEquivalent: number;
}

export interface ToolCostTotals {
  currency: string;
  /** Costo recurrente normalizado a "por mes" (anual / 12) — pagos únicos no suman acá. */
  monthlyEquivalent: number;
  /** Ranking de herramientas por costo mensual, de mayor a menor — para el gráfico de "gasto por herramienta". */
  topTools: ToolCostBreakdownRow[];
}

export interface ToolRenewalRow {
  toolId: string;
  name: string;
  amount: number | null;
  currency: string;
  frequency: ToolCostFrequency | null;
  nextRenewalDate: string;
  urgency: DateUrgency;
}

export interface ToolsCostOverview {
  byCurrency: ToolCostTotals[];
  /** Herramientas con fecha de vencimiento cargada, la más próxima primero. */
  renewals: ToolRenewalRow[];
}

/**
 * Agrega el costo de las herramientas por moneda (pura, sin I/O) — un pago
 * único no es "gasto recurrente" así que no entra en `monthlyEquivalent`,
 * pero sí aparece en `renewals` si tiene fecha de vencimiento cargada.
 */
export function computeToolsCostOverview(tools: AgencyToolWithAccess[]): ToolsCostOverview {
  const byCurrencyMap = new Map<string, number>();
  const topToolsMap = new Map<string, ToolCostBreakdownRow[]>();
  for (const tool of tools) {
    if (tool.cost_amount == null || !tool.cost_frequency || tool.cost_frequency === "unico") continue;
    const monthly = tool.cost_frequency === "anual" ? tool.cost_amount / 12 : tool.cost_amount;
    byCurrencyMap.set(tool.cost_currency, (byCurrencyMap.get(tool.cost_currency) ?? 0) + monthly);
    const rows = topToolsMap.get(tool.cost_currency) ?? [];
    rows.push({ toolId: tool.id, name: tool.name, monthlyEquivalent: monthly });
    topToolsMap.set(tool.cost_currency, rows);
  }

  const renewals: ToolRenewalRow[] = tools
    .filter((t): t is AgencyToolWithAccess & { next_renewal_date: string } => t.next_renewal_date != null)
    .map((t) => ({
      toolId: t.id,
      name: t.name,
      amount: t.cost_amount,
      currency: t.cost_currency,
      frequency: t.cost_frequency,
      nextRenewalDate: t.next_renewal_date,
      urgency: getDateUrgency(t.next_renewal_date),
    }))
    .sort((a, b) => a.nextRenewalDate.localeCompare(b.nextRenewalDate));

  return {
    byCurrency: Array.from(byCurrencyMap.entries())
      .map(([currency, monthlyEquivalent]) => ({
        currency,
        monthlyEquivalent,
        topTools: (topToolsMap.get(currency) ?? []).sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent),
      }))
      .sort((a, b) => a.currency.localeCompare(b.currency)),
    renewals,
  };
}

/* ------------------------------------------------------------------ */
/* Evolución mensual de pagos a editores — misma idea que               */
/* `computeBillingAnalytics` de queries/billing.ts (que no se puede      */
/* reusar directo acá por su `import "server-only"`), aplicada a         */
/* `editor_payouts` en vez de `billing_invoices`: un pago "pagado" cuenta */
/* para el mes de `paid_at`, uno "pendiente" para el mes de `due_date`.   */
/* ------------------------------------------------------------------ */

export interface EditorPayoutMonthlyPoint {
  /** "2026-08" */
  month: string;
  /** "Ago" (o "Ago 25" si el rango cruza años) */
  label: string;
  paid: number;
  pending: number;
  total: number;
}

export interface EditorPayoutsMonthly {
  currency: string;
  monthly: EditorPayoutMonthlyPoint[];
}

function monthKeyOfDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelOfDate(d: Date, spansYears: boolean): string {
  const base = new Intl.DateTimeFormat("es-AR", { month: "short" }).format(d).replace(".", "");
  const cap = base.charAt(0).toUpperCase() + base.slice(1);
  return spansYears ? `${cap} ${String(d.getFullYear()).slice(2)}` : cap;
}

/** Agrega el historial de pagos a editores (de TODOS los editores) en una serie mensual por moneda, últimos `monthsBack` meses. */
export function computeEditorPayoutsMonthly(payouts: EditorPayout[], monthsBack = 6): EditorPayoutsMonthly[] {
  const anchor = new Date();
  anchor.setDate(1);
  anchor.setHours(0, 0, 0, 0);

  const months: Date[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    months.push(new Date(anchor.getFullYear(), anchor.getMonth() - i, 1));
  }
  const spansYears = months[0].getFullYear() !== months[months.length - 1].getFullYear();
  const monthKeys = months.map(monthKeyOfDate);

  const byCurrency = new Map<string, Map<string, { paid: number; pending: number }>>();
  for (const p of payouts) {
    const buckets = byCurrency.get(p.currency) ?? new Map(monthKeys.map((k) => [k, { paid: 0, pending: 0 }]));
    byCurrency.set(p.currency, buckets);

    if (p.status === "pagado" && p.paid_at) {
      const bucket = buckets.get(monthKeyOfDate(new Date(p.paid_at)));
      if (bucket) bucket.paid += Number(p.amount);
    } else if (p.status === "pendiente") {
      const bucket = buckets.get(monthKeyOfDate(new Date(p.due_date)));
      if (bucket) bucket.pending += Number(p.amount);
    }
  }

  return Array.from(byCurrency.entries())
    .map(([currency, buckets]) => ({
      currency,
      monthly: months.map((d) => {
        const key = monthKeyOfDate(d);
        const b = buckets.get(key)!;
        return {
          month: key,
          label: monthLabelOfDate(d, spansYears),
          paid: b.paid,
          pending: b.pending,
          total: b.paid + b.pending,
        };
      }),
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}
