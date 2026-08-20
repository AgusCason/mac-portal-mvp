import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BillingInvoice, InvoiceStatus } from "@/types/database";

export interface InvoiceWithRelations extends BillingInvoice {
  client_name: string;
  plan_name: string | null;
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
export async function getInvoices(clientId?: string): Promise<InvoiceWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("billing_invoices")
    .select("*, clients(name), plans(name)")
    .order("due_date", { ascending: false });

  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) {
    console.error("[getInvoices]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const { clients, plans, ...rest } = row as BillingInvoice & {
      clients: { name: string } | null;
      plans: { name: string } | null;
    };
    return {
      ...rest,
      client_name: clients?.name ?? "—",
      plan_name: plans?.name ?? null,
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
