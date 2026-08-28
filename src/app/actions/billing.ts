"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getBranding } from "@/lib/queries/branding";
import { buildInvoicePdf } from "@/lib/billing-pdf";
import type { InvoiceWithRelations } from "@/lib/queries/billing";
import type { BillingInvoice } from "@/types/database";

const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  planId: z.string().uuid().optional().or(z.literal("")),
  webProjectId: z.string().uuid().optional().or(z.literal("")),
  amount: z.coerce.number().positive("El monto tiene que ser mayor a 0"),
  currency: z.string().min(1).default("ARS"),
  method: z.enum(["mercadopago", "paypal", "transferencia", "payoneer", "crypto", "otro"]),
  dueDate: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  notes: z.string().optional(),
});

/**
 * Genera una factura/cobro para un cliente. Mercado Pago y PayPal quedan
 * marcados como "automáticos" en el `method` para que la UI los distinga,
 * pero la conciliación real de pago (webhook del gateway) es un punto de
 * extensión que requiere las credenciales de comercio propias del cliente —
 * por ahora, todo método se concilia con "Marcar pago recibido".
 */
export async function createInvoiceAction(formData: FormData) {
  await requireAdmin();
  const parsed = createInvoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    planId: formData.get("planId") ?? "",
    webProjectId: formData.get("webProjectId") ?? "",
    amount: formData.get("amount"),
    currency: formData.get("currency") || "ARS",
    method: formData.get("method"),
    dueDate: formData.get("dueDate"),
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("billing_invoices").insert({
    client_id: parsed.data.clientId,
    plan_id: parsed.data.planId || null,
    web_project_id: parsed.data.webProjectId || null,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    method: parsed.data.method,
    due_date: parsed.data.dueDate,
    notes: parsed.data.notes || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/planes");
  revalidatePath("/admin/sitios-web");
  if (parsed.data.webProjectId) revalidatePath(`/admin/sitios-web/${parsed.data.webProjectId}`);
  return { ok: true };
}

/** Concilia manualmente una factura como pagada (cualquier método). Solo admin. */
export async function markInvoicePaidAction(invoiceId: string) {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("billing_invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      marked_paid_by: admin.id,
    })
    .eq("id", invoiceId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/planes");
  return { ok: true };
}

/**
 * El cliente avisa "ya pagué/transferí" desde /client/facturas — Nivel 1 de
 * pagos: no concilia sola, solo notifica al admin (vía la RPC
 * `report_invoice_payment`, que valida que la factura sea suya y siga
 * pendiente/atrasada) para que la marque pagada a mano una vez que se
 * acredite. `method` es de qué botón vino el aviso (paypal/mercadopago/
 * payoneer/transferencia), solo para el mensaje — no cambia el `method` de
 * la factura.
 */
export async function reportInvoicePaymentAction(invoiceId: string, method?: string) {
  await requireRole(["client"]);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("report_invoice_payment", {
    target_invoice_id: invoiceId,
    p_method: method ?? null,
  });

  if (error) return { ok: false, error: error.message };
  if (!data) {
    return {
      ok: false,
      error: "No se pudo avisar el pago — la factura ya no está pendiente o no es tuya.",
    };
  }
  revalidatePath("/client/facturas");
  return { ok: true };
}

/**
 * Genera el PDF de una factura al vuelo (nada se guarda — ver
 * `buildInvoicePdf`). Devuelve el contenido en base64 para que el cliente
 * arme un blob y dispare la descarga, sin necesitar un bucket de Storage.
 * El SELECT de acá respeta RLS: el cliente solo puede pedir el PDF de SUS
 * propias facturas (mismo criterio que `getReportDownloadUrlAction`).
 */
export async function getInvoicePdfAction(
  invoiceId: string
): Promise<{ ok: true; base64: string; filename: string } | { ok: false; error: string }> {
  await requireRole(["admin", "client"]);
  const supabase = await createSupabaseServerClient();

  const { data: row, error } = await supabase
    .from("billing_invoices")
    .select("*, clients(name), plans(name)")
    .eq("id", invoiceId)
    .single();

  if (error || !row) {
    return { ok: false, error: "No tenés acceso a esta factura." };
  }

  const { clients, plans, ...rest } = row as BillingInvoice & {
    clients: { name: string } | null;
    plans: { name: string } | null;
  };
  const daysOverdue = 0; // no importa para el PDF — no se muestra ese dato
  const invoice: InvoiceWithRelations = {
    ...rest,
    client_name: clients?.name ?? "—",
    plan_name: plans?.name ?? null,
    web_project_title: null, // no se muestra en el PDF
    daysOverdue,
  };

  const branding = await getBranding();

  try {
    const pdfBuffer = await buildInvoicePdf({ agencyName: branding.app_name, invoice });
    return {
      ok: true,
      base64: pdfBuffer.toString("base64"),
      filename: `factura-${invoice.id.slice(0, 8)}.pdf`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo armar el PDF." };
  }
}

/** Cancela una factura (ej: se creó por error). Solo admin. */
export async function cancelInvoiceAction(invoiceId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("billing_invoices")
    .update({ status: "cancelled" })
    .eq("id", invoiceId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/planes");
  return { ok: true };
}
