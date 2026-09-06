import "server-only";
import { getInvoices, computeBillingAnalytics, type BillingAnalytics } from "@/lib/queries/billing";
import { getAgencyTools } from "@/lib/queries/tools";
import {
  getEditorFinanceOverview,
  mergeFinanceTotals,
  getAllEditorPayouts,
} from "@/lib/queries/editor-finance";
import {
  computeToolsCostOverview,
  computeEditorPayoutsMonthly,
  type ToolsCostOverview,
  type EditorPayoutsMonthly,
} from "@/lib/finance-utils";

/* ------------------------------------------------------------------ */
/* Pago Clientes — reutiliza billing_invoices (ya es "lo que pagan los */
/* clientes"), no hace falta tabla nueva.                              */
/* ------------------------------------------------------------------ */

export interface ClientPaymentTotals {
  currency: string;
  collectedThisMonth: number;
  pendingTotal: number;
  overdueTotal: number;
}

export interface UpcomingClientPayment {
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  dueDate: string;
  isOverdue: boolean;
}

export interface ClientPaymentsOverview {
  byCurrency: ClientPaymentTotals[];
  /** Facturas pendientes/atrasadas, la más próxima primero — "fechas de pago de cada uno". */
  upcoming: UpcomingClientPayment[];
  /** Evolución mensual (últimos 6 meses) por moneda — para el gráfico del dashboard general. */
  monthly: BillingAnalytics[];
}

function monthKeyOf(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/** Resumen de lo que pagan los clientes — total del mes, pendiente, atrasado, y próximos vencimientos. */
export async function getClientPaymentsOverview(): Promise<ClientPaymentsOverview> {
  const invoices = await getInvoices();
  const nowKey = monthKeyOf(new Date().toISOString());

  const byCurrencyMap = new Map<string, ClientPaymentTotals>();
  for (const inv of invoices) {
    const bucket = byCurrencyMap.get(inv.currency) ?? {
      currency: inv.currency,
      collectedThisMonth: 0,
      pendingTotal: 0,
      overdueTotal: 0,
    };
    const amount = Number(inv.amount);
    if (inv.status === "paid") {
      if (inv.paid_at && monthKeyOf(inv.paid_at) === nowKey) bucket.collectedThisMonth += amount;
    } else if (inv.status !== "cancelled") {
      if (inv.daysOverdue > 0) bucket.overdueTotal += amount;
      else bucket.pendingTotal += amount;
    }
    byCurrencyMap.set(inv.currency, bucket);
  }

  const upcoming: UpcomingClientPayment[] = invoices
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .map((i) => ({
      clientId: i.client_id,
      clientName: i.client_name,
      amount: Number(i.amount),
      currency: i.currency,
      dueDate: i.due_date,
      isOverdue: i.daysOverdue > 0,
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const currencies = Array.from(new Set(invoices.map((i) => i.currency))).sort((a, b) => a.localeCompare(b));
  const monthly = currencies.map((currency) => computeBillingAnalytics(invoices, currency, 6));

  return {
    byCurrency: Array.from(byCurrencyMap.values()).sort((a, b) => a.currency.localeCompare(b.currency)),
    upcoming,
    monthly,
  };
}

/* ------------------------------------------------------------------ */
/* Pago Herramientas — costo cargado a mano en cada herramienta         */
/* (agency_tools.cost_*). La agregación pura (`computeToolsCostOverview`) */
/* vive en `@/lib/finance-utils` para poder testearla con vitest sin      */
/* arrastrar el guard de "server-only" de este archivo — acá solo se hace */
/* el fetch y se la pasa.                                                 */
/* ------------------------------------------------------------------ */

export type { ToolsCostOverview, ToolCostTotals, ToolRenewalRow } from "@/lib/finance-utils";

export async function getToolsCostOverview(): Promise<ToolsCostOverview> {
  const tools = await getAgencyTools();
  return computeToolsCostOverview(tools);
}

/* ------------------------------------------------------------------ */
/* Pago Editor — reutiliza lo que ya existe en queries/editor-finance.  */
/* La evolución mensual agregada (todos los editores) es nueva: junta    */
/* `getAllEditorPayouts` (I/O) con `computeEditorPayoutsMonthly` (pura,   */
/* en finance-utils.ts) igual que se hizo con Herramientas.              */
/* ------------------------------------------------------------------ */

export { getEditorFinanceOverview, mergeFinanceTotals };
export type { EditorPayoutsMonthly };

export async function getEditorPayoutsMonthly(): Promise<EditorPayoutsMonthly[]> {
  const payouts = await getAllEditorPayouts();
  return computeEditorPayoutsMonthly(payouts);
}
