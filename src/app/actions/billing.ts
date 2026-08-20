"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  planId: z.string().uuid().optional().or(z.literal("")),
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
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    method: parsed.data.method,
    due_date: parsed.data.dueDate,
    notes: parsed.data.notes || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/planes");
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
