// NOTA: este archivo NO importa "server-only" a propósito — a diferencia de
// queries/finance-overview.ts (que sí lo hace, porque consulta la base),
// las funciones puras de acá abajo se testean con vitest, y "server-only"
// tira un error si se intenta importar fuera de un Server Component. El
// import de tipo de `AgencyToolWithAccess` de abajo es SOLO de tipo (`import
// type`), así que se borra en compilación y no arrastra ese guard.
import type { AgencyToolWithAccess } from "@/lib/queries/tools";
import type { ToolCostFrequency } from "@/types/database";

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

export interface ToolCostTotals {
  currency: string;
  /** Costo recurrente normalizado a "por mes" (anual / 12) — pagos únicos no suman acá. */
  monthlyEquivalent: number;
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
  for (const tool of tools) {
    if (tool.cost_amount == null || !tool.cost_frequency || tool.cost_frequency === "unico") continue;
    const monthly = tool.cost_frequency === "anual" ? tool.cost_amount / 12 : tool.cost_amount;
    byCurrencyMap.set(tool.cost_currency, (byCurrencyMap.get(tool.cost_currency) ?? 0) + monthly);
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
      .map(([currency, monthlyEquivalent]) => ({ currency, monthlyEquivalent }))
      .sort((a, b) => a.currency.localeCompare(b.currency)),
    renewals,
  };
}
