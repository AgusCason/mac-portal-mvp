import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BillingInvoice, InvoiceStatus } from "@/types/database";
import { PAYMENT_METHOD_LABELS } from "@/lib/billing-labels";

export interface InvoiceWithRelations extends BillingInvoice {
  client_name: string;
  plan_name: string | null;
  /** Título del proyecto de Sitios Web, si esta factura corresponde a uno. */
  web_project_title: string | null;
  /**
   * Días de atraso respecto a `due_date` (0 si no está vencida o ya está
   * paga/cancelada). Base del módulo de morosidad: 1-7 días sugiere
   * recordatorio automático por WhatsApp, 15+ sugiere bloqueo — pero el
   * bloqueo siempre lo decide el admin manualmente, nunca es automático.
   */
  daysOverdue: number;
}

function computeDaysOverdue(dueDate: string, status: InvoiceStatus): number {
  if (status === "paid" || status === "cancelled") return 0;
  const due = new Date(dueDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - due.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

/** Lista facturas. RLS acota a admin (todas) o al cliente dueño (las suyas). */
export async function getInvoices(clientId?: string, limit = 500): Promise<InvoiceWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("billing_invoices")
    .select("*, clients(name), plans(name), web_projects(title)")
    .order("due_date", { ascending: false })
    .limit(limit);

  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) {
    console.error("[getInvoices]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const { clients, plans, web_projects, ...rest } = row as BillingInvoice & {
      clients: { name: string } | null;
      plans: { name: string } | null;
      web_projects: { title: string } | null;
    };
    return {
      ...rest,
      client_name: clients?.name ?? "—",
      plan_name: plans?.name ?? null,
      web_project_title: web_projects?.title ?? null,
      daysOverdue: computeDaysOverdue(rest.due_date, rest.status),
    };
  });
}

/** Facturas de un proyecto de Sitios Web puntual — ver ficha de `/admin/sitios-web/[id]`. */
export async function getInvoicesForWebProject(webProjectId: string): Promise<InvoiceWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billing_invoices")
    .select("*, clients(name), plans(name), web_projects(title)")
    .eq("web_project_id", webProjectId)
    .order("due_date", { ascending: false });

  if (error) {
    console.error("[getInvoicesForWebProject]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const { clients, plans, web_projects, ...rest } = row as BillingInvoice & {
      clients: { name: string } | null;
      plans: { name: string } | null;
      web_projects: { title: string } | null;
    };
    return {
      ...rest,
      client_name: clients?.name ?? "—",
      plan_name: plans?.name ?? null,
      web_project_title: web_projects?.title ?? null,
      daysOverdue: computeDaysOverdue(rest.due_date, rest.status),
    };
  });
}

export interface BillingSummary {
  pendingCount: number;
  overdueCount: number;
  delinquentCount: number;
  pendingTotal: number;
}

/** Resumen rápido para el header del módulo de facturación. */
export async function getBillingSummary(): Promise<BillingSummary> {
  const invoices = await getInvoices();
  const open = invoices.filter((i) => i.status === "pending" || i.status === "overdue");
  return {
    pendingCount: open.length,
    overdueCount: open.filter((i) => i.daysOverdue > 0).length,
    delinquentCount: open.filter((i) => i.daysOverdue >= 15).length,
    pendingTotal: open.reduce((sum, i) => sum + Number(i.amount), 0),
  };
}

/* ------------------------------------------------------------------ */
/* Dashboard de facturación — agregaciones puras (sin I/O).            */
/*                                                                      */
/* Reciben las facturas ya cargadas (RLS ya las acotó a admin) y        */
/* calculan las series que alimentan el dashboard. Se calculan en el    */
/* server component de la página y se pasan como datos planos al        */
/* dashboard de cliente — sin refetch, sin duplicar la query.           */
/* ------------------------------------------------------------------ */

export interface MonthlyBillingPoint {
  /** "2026-08" */
  month: string;
  /** "Ago" (o "Ago 25" si el rango cruza años) */
  label: string;
  paid: number;
  pending: number;
  overdue: number;
  cancelled: number;
  total: number;
}

export interface PaymentMethodPoint {
  method: string;
  label: string;
  total: number;
  count: number;
}

export interface BillingKpis {
  currentMonthTotal: number;
  previousMonthTotal: number;
  /** null si no hay mes anterior con datos (evita dividir por cero) */
  deltaPct: number | null;
  collectedThisMonth: number;
  /** cobrado / (cobrado + pendiente + atrasado) del mes actual, null si no hubo facturación */
  collectionRatePct: number | null;
  pendingTotal: number;
  overdueTotal: number;
  overdueCount: number;
  /** últimos 6 meses, del más viejo al más nuevo — para el sparkline */
  sparkline: number[];
}

export interface BillingAnalytics {
  currency: string;
  monthly: MonthlyBillingPoint[];
  methods: PaymentMethodPoint[];
  kpis: BillingKpis;
  hasData: boolean;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date, spansYears: boolean) {
  const base = new Intl.DateTimeFormat("es-AR", { month: "short" }).format(d).replace(".", "");
  const cap = base.charAt(0).toUpperCase() + base.slice(1);
  return spansYears ? `${cap} ${String(d.getFullYear()).slice(2)}` : cap;
}

/**
 * Arma las series del dashboard de facturación para una moneda dada.
 *
 * - "Facturado" de un mes = facturas cuyo `created_at` cae en ese mes
 *   (fecha de emisión), sin importar cuándo vencen o se cobran.
 * - El estado de cada factura para el gráfico apilado replica exactamente
 *   la lógica que ya usa `InvoiceList`/`StatusBadge`: pagada/cancelada por
 *   `status`, y "atrasada" por `daysOverdue > 0` (no por el enum `overdue`
 *   crudo) — así el dashboard nunca contradice lo que el admin ve en la
 *   tabla de facturas.
 * - "Método de pago" se agrega sobre todo el historial disponible (no solo
 *   la ventana de meses visible), excluyendo canceladas.
 */
export function computeBillingAnalytics(
  invoices: InvoiceWithRelations[],
  currency: string,
  monthsBack = 12
): BillingAnalytics {
  const anchor = new Date();
  anchor.setDate(1);
  anchor.setHours(0, 0, 0, 0);

  const months: Date[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    months.push(new Date(anchor.getFullYear(), anchor.getMonth() - i, 1));
  }
  const spansYears = months[0].getFullYear() !== months[months.length - 1].getFullYear();

  const buckets = new Map<string, { paid: number; pending: number; overdue: number; cancelled: number }>(
    months.map((d) => [monthKey(d), { paid: 0, pending: 0, overdue: 0, cancelled: 0 }])
  );

  const scoped = invoices.filter((i) => i.currency === currency);

  for (const inv of scoped) {
    const bucket = buckets.get(monthKey(new Date(inv.created_at)));
    if (!bucket) continue; // fuera de la ventana visible
    const amount = Number(inv.amount);
    if (inv.status === "cancelled") bucket.cancelled += amount;
    else if (inv.status === "paid") bucket.paid += amount;
    else if (inv.daysOverdue > 0) bucket.overdue += amount;
    else bucket.pending += amount;
  }

  const monthly: MonthlyBillingPoint[] = months.map((d) => {
    const b = buckets.get(monthKey(d))!;
    return {
      month: monthKey(d),
      label: monthLabel(d, spansYears),
      ...b,
      total: b.paid + b.pending + b.overdue + b.cancelled,
    };
  });

  const methodTotals = new Map<string, { total: number; count: number }>();
  for (const inv of scoped) {
    if (inv.status === "cancelled") continue;
    const cur = methodTotals.get(inv.method) ?? { total: 0, count: 0 };
    cur.total += Number(inv.amount);
    cur.count += 1;
    methodTotals.set(inv.method, cur);
  }
  const methods: PaymentMethodPoint[] = Array.from(methodTotals.entries())
    .map(([method, v]) => ({
      method,
      label: PAYMENT_METHOD_LABELS[method] ?? method,
      total: v.total,
      count: v.count,
    }))
    .sort((a, b) => b.total - a.total);

  const current = monthly[monthly.length - 1];
  const previous = monthly[monthly.length - 2];
  const currentMonthTotal = current?.total ?? 0;
  const previousMonthTotal = previous?.total ?? 0;
  const deltaPct =
    previousMonthTotal > 0 ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 : null;

  const collectedThisMonth = current?.paid ?? 0;
  const billedDenominator = current ? current.paid + current.pending + current.overdue : 0;
  const collectionRatePct = billedDenominator > 0 ? (collectedThisMonth / billedDenominator) * 100 : null;

  const openInvoices = scoped.filter((i) => i.status !== "paid" && i.status !== "cancelled");
  const pendingTotal = openInvoices
    .filter((i) => i.daysOverdue === 0)
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const overdueOpen = openInvoices.filter((i) => i.daysOverdue > 0);
  const overdueTotal = overdueOpen.reduce((sum, i) => sum + Number(i.amount), 0);

  return {
    currency,
    monthly,
    methods,
    kpis: {
      currentMonthTotal,
      previousMonthTotal,
      deltaPct,
      collectedThisMonth,
      collectionRatePct,
      pendingTotal,
      overdueTotal,
      overdueCount: overdueOpen.length,
      sparkline: monthly.slice(-6).map((m) => m.total),
    },
    hasData: scoped.length > 0,
  };
}
