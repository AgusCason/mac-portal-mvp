import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EditorPayout, EditorPayFrequency, EditorPayoutMethod, EditorPayoutStatus } from "@/types/database";

/** Tarifa acordada con un editor para un cliente puntual (parte de la asignación). */
export interface EditorClientRate {
  assignmentId: string;
  clientId: string;
  clientName: string;
  clientStatus: string;
  amount: number | null;
  currency: string;
  frequency: EditorPayFrequency | null;
  paymentDay: number | null;
  notes: string | null;
}

/** Todos los clientes asignados a un editor, con su tarifa (si ya se definió). */
export async function getEditorRates(editorId: string): Promise<EditorClientRate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("editor_client_assignments")
    .select(
      "id, client_id, pay_amount, pay_currency, pay_frequency, pay_day, pay_notes, clients(name, status)"
    )
    .eq("editor_id", editorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getEditorRates]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const client = row.clients as unknown as { name: string; status: string } | null;
    return {
      assignmentId: row.id,
      clientId: row.client_id,
      clientName: client?.name ?? "—",
      clientStatus: client?.status ?? "active",
      amount: row.pay_amount,
      currency: row.pay_currency,
      frequency: row.pay_frequency,
      paymentDay: row.pay_day,
      notes: row.pay_notes,
    };
  });
}

export interface EditorPayoutWithClient extends EditorPayout {
  client_name: string | null;
}

/** Historial de pagos de un editor puntual (ver/admin, o el propio editor vía RLS). */
export async function getEditorPayouts(editorId: string, limit = 300): Promise<EditorPayoutWithClient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("editor_payouts")
    .select("*, clients(name)")
    .eq("editor_id", editorId)
    .order("due_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getEditorPayouts]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const { clients, ...rest } = row as EditorPayout & { clients: { name: string } | null };
    return { ...rest, client_name: clients?.name ?? null };
  });
}

export interface EditorFinanceTotalsByCurrency {
  currency: string;
  paidAllTime: number;
  paidThisMonth: number;
  pending: number;
  /** Fecha (YYYY-MM-DD) del próximo pago pendiente más cercano, o null si no hay ninguno. */
  nextDueDate: string | null;
}

function monthKeyOf(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/**
 * Agrega el historial de pagos de un editor por moneda — nunca se suman
 * montos de monedas distintas entre sí (un editor puede cobrar parte en ARS
 * y parte en USD, cada una con su propio total).
 */
export function computeEditorFinanceTotals(payouts: EditorPayout[]): EditorFinanceTotalsByCurrency[] {
  const nowKey = monthKeyOf(new Date().toISOString());
  const byCurrency = new Map<string, EditorFinanceTotalsByCurrency>();

  for (const p of payouts) {
    const bucket = byCurrency.get(p.currency) ?? {
      currency: p.currency,
      paidAllTime: 0,
      paidThisMonth: 0,
      pending: 0,
      nextDueDate: null,
    };

    if (p.status === "pagado") {
      bucket.paidAllTime += Number(p.amount);
      if (p.paid_at && monthKeyOf(p.paid_at) === nowKey) {
        bucket.paidThisMonth += Number(p.amount);
      }
    } else {
      bucket.pending += Number(p.amount);
      if (!bucket.nextDueDate || p.due_date < bucket.nextDueDate) {
        bucket.nextDueDate = p.due_date;
      }
    }

    byCurrency.set(p.currency, bucket);
  }

  return Array.from(byCurrency.values()).sort((a, b) => a.currency.localeCompare(b.currency));
}

export interface EditorFinanceOverviewRow {
  editorId: string;
  editorName: string;
  editorEmail: string;
  ratesCount: number;
  totals: EditorFinanceTotalsByCurrency[];
}

/** Panel general de Finanzas de Equipo — un resumen por editor, para /admin/finanzas-equipo. */
export async function getEditorFinanceOverview(): Promise<EditorFinanceOverviewRow[]> {
  const supabase = await createClient();
  const { data: editors, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "editor")
    .order("full_name");

  if (error) {
    console.error("[getEditorFinanceOverview]", error.message);
    return [];
  }

  return Promise.all(
    (editors ?? []).map(async (editor) => {
      const [rates, payouts] = await Promise.all([
        getEditorRates(editor.id),
        getEditorPayouts(editor.id),
      ]);
      return {
        editorId: editor.id,
        editorName: editor.full_name || editor.email,
        editorEmail: editor.email,
        ratesCount: rates.filter((r) => r.amount != null).length,
        totals: computeEditorFinanceTotals(payouts),
      };
    })
  );
}

/** Suma los totales por moneda de varios editores en uno solo por moneda — para el KPI general de la agencia. */
export function mergeFinanceTotals(
  rows: EditorFinanceTotalsByCurrency[][]
): EditorFinanceTotalsByCurrency[] {
  const byCurrency = new Map<string, EditorFinanceTotalsByCurrency>();

  for (const totals of rows) {
    for (const t of totals) {
      const bucket = byCurrency.get(t.currency) ?? {
        currency: t.currency,
        paidAllTime: 0,
        paidThisMonth: 0,
        pending: 0,
        nextDueDate: null as string | null,
      };
      bucket.paidAllTime += t.paidAllTime;
      bucket.paidThisMonth += t.paidThisMonth;
      bucket.pending += t.pending;
      if (t.nextDueDate && (!bucket.nextDueDate || t.nextDueDate < bucket.nextDueDate)) {
        bucket.nextDueDate = t.nextDueDate;
      }
      byCurrency.set(t.currency, bucket);
    }
  }

  return Array.from(byCurrency.values()).sort((a, b) => a.currency.localeCompare(b.currency));
}

export type { EditorPayout, EditorPayFrequency, EditorPayoutMethod, EditorPayoutStatus };
