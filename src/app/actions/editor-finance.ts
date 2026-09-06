"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const PAY_FREQUENCIES = ["mensual", "quincenal", "unico", "por_entrega"] as const;
const PAYOUT_METHODS = [
  "transferencia",
  "mercadopago",
  "paypal",
  "payoneer",
  "efectivo",
  "crypto",
  "otro",
] as const;

const rateSchema = z.object({
  payAmount: z.coerce.number().positive("El monto tiene que ser mayor a 0").optional().or(z.nan()),
  payCurrency: z.string().min(1).default("ARS"),
  payFrequency: z.enum(PAY_FREQUENCIES).optional().or(z.literal("")),
  payDay: z.coerce.number().int().min(1).max(31).optional().or(z.nan()),
  payNotes: z.string().optional(),
});

/**
 * Edita SOLO la tarifa de una asignación ya existente (desde Finanzas de
 * Equipo) — a diferencia de `assignEditorToClientAction`, nunca toca
 * `can_view_chat`/`can_view_drive`, así que sirve para ajustar el pago sin
 * arriesgar pisar permisos ya definidos desde la ficha del cliente.
 */
export async function updateAssignmentPayAction(assignmentId: string, formData: FormData) {
  await requireAdmin();
  const parsed = rateSchema.safeParse({
    payAmount: formData.get("payAmount") || undefined,
    payCurrency: formData.get("payCurrency") || "ARS",
    payFrequency: formData.get("payFrequency") || "",
    payDay: formData.get("payDay") || undefined,
    payNotes: formData.get("payNotes") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: assignment, error: findError } = await supabase
    .from("editor_client_assignments")
    .select("editor_id, client_id")
    .eq("id", assignmentId)
    .single();
  if (findError || !assignment) return { ok: false, error: "No se encontró la asignación." };

  const { error } = await supabase
    .from("editor_client_assignments")
    .update({
      pay_amount: Number.isNaN(parsed.data.payAmount) ? null : (parsed.data.payAmount ?? null),
      pay_currency: parsed.data.payCurrency,
      pay_frequency: parsed.data.payFrequency || null,
      pay_day: Number.isNaN(parsed.data.payDay) ? null : (parsed.data.payDay ?? null),
      pay_notes: parsed.data.payNotes || null,
    })
    .eq("id", assignmentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/finanzas-equipo");
  revalidatePath(`/admin/finanzas-equipo/${assignment.editor_id}`);
  revalidatePath("/editor/finanzas");
  return { ok: true };
}

const payoutSchema = z.object({
  editorId: z.string().uuid(),
  clientId: z.string().uuid().optional().or(z.literal("")),
  amount: z.coerce.number().positive("El monto tiene que ser mayor a 0"),
  currency: z.string().min(1).default("ARS"),
  method: z.enum(PAYOUT_METHODS).optional().or(z.literal("")),
  status: z.enum(["pendiente", "pagado"]).default("pendiente"),
  periodLabel: z.string().optional(),
  dueDate: z.string().min(1, "La fecha es obligatoria"),
  notes: z.string().optional(),
});

/**
 * Carga a mano una fila del historial de pagos de un editor — puede ser un
 * pago ya hecho (status "pagado", con `paid_at` = ahora) o uno pendiente
 * programado a futuro (status "pendiente", solo con la fecha esperada). El
 * admin es quien decide cuándo pasa de uno a otro (`markPayoutPaidAction`),
 * nunca se genera nada solo — ver 0040_editor_finance_and_tools.sql.
 */
export async function createPayoutAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = payoutSchema.safeParse({
    editorId: formData.get("editorId"),
    clientId: formData.get("clientId") || "",
    amount: formData.get("amount"),
    currency: formData.get("currency") || "ARS",
    method: formData.get("method") || "",
    status: formData.get("status") || "pendiente",
    periodLabel: formData.get("periodLabel") ?? undefined,
    dueDate: formData.get("dueDate"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const isPaid = parsed.data.status === "pagado";
  const { error } = await supabase.from("editor_payouts").insert({
    editor_id: parsed.data.editorId,
    client_id: parsed.data.clientId || null,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    method: parsed.data.method || null,
    status: parsed.data.status,
    period_label: parsed.data.periodLabel || null,
    due_date: parsed.data.dueDate,
    paid_at: isPaid ? new Date().toISOString() : null,
    notes: parsed.data.notes || null,
    created_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };

  if (isPaid) {
    await supabase.rpc("notify_user", {
      p_profile_id: parsed.data.editorId,
      p_title: "Nuevo pago registrado",
      p_body: `Te registramos un pago de ${parsed.data.amount} ${parsed.data.currency}.`,
      p_link: "/editor/finanzas",
    });
  }

  revalidatePath("/admin/finanzas-equipo");
  revalidatePath(`/admin/finanzas-equipo/${parsed.data.editorId}`);
  revalidatePath("/editor/finanzas");
  return { ok: true };
}

/** Marca un pago pendiente como pagado (fecha de pago = ahora, método opcional). */
export async function markPayoutPaidAction(payoutId: string, method?: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: payout, error: findError } = await supabase
    .from("editor_payouts")
    .select("editor_id, amount, currency")
    .eq("id", payoutId)
    .single();
  if (findError || !payout) return { ok: false, error: "No se encontró el pago." };

  const { error } = await supabase
    .from("editor_payouts")
    .update({
      status: "pagado",
      paid_at: new Date().toISOString(),
      ...(method ? { method: method as (typeof PAYOUT_METHODS)[number] } : {}),
    })
    .eq("id", payoutId);

  if (error) return { ok: false, error: error.message };

  await supabase.rpc("notify_user", {
    p_profile_id: payout.editor_id,
    p_title: "Te pagamos",
    p_body: `Se marcó como pagado tu pago de ${payout.amount} ${payout.currency}.`,
    p_link: "/editor/finanzas",
  });

  revalidatePath("/admin/finanzas-equipo");
  revalidatePath(`/admin/finanzas-equipo/${payout.editor_id}`);
  revalidatePath("/editor/finanzas");
  return { ok: true };
}

const updatePayoutSchema = payoutSchema.omit({ editorId: true });

/** Edita una fila del historial (corregir monto, fecha, método, notas). */
export async function updatePayoutAction(payoutId: string, formData: FormData) {
  await requireAdmin();
  const parsed = updatePayoutSchema.safeParse({
    clientId: formData.get("clientId") || "",
    amount: formData.get("amount"),
    currency: formData.get("currency") || "ARS",
    method: formData.get("method") || "",
    status: formData.get("status") || "pendiente",
    periodLabel: formData.get("periodLabel") ?? undefined,
    dueDate: formData.get("dueDate"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: findError } = await supabase
    .from("editor_payouts")
    .select("editor_id, status, paid_at")
    .eq("id", payoutId)
    .single();
  if (findError || !existing) return { ok: false, error: "No se encontró el pago." };

  const nowPaid = parsed.data.status === "pagado";
  const { error } = await supabase
    .from("editor_payouts")
    .update({
      client_id: parsed.data.clientId || null,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      method: parsed.data.method || null,
      status: parsed.data.status,
      period_label: parsed.data.periodLabel || null,
      due_date: parsed.data.dueDate,
      // Si pasa a "pagado" y todavía no tenía fecha de pago, se la ponemos
      // ahora; si ya estaba pagado, conservamos la fecha original.
      paid_at: nowPaid ? (existing.paid_at ?? new Date().toISOString()) : null,
      notes: parsed.data.notes || null,
    })
    .eq("id", payoutId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/finanzas-equipo");
  revalidatePath(`/admin/finanzas-equipo/${existing.editor_id}`);
  revalidatePath("/editor/finanzas");
  return { ok: true };
}

/** Elimina una fila del historial (ej. se cargó por error). */
export async function deletePayoutAction(payoutId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("editor_payouts")
    .select("editor_id")
    .eq("id", payoutId)
    .single();

  const { error } = await supabase.from("editor_payouts").delete().eq("id", payoutId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/finanzas-equipo");
  if (existing) revalidatePath(`/admin/finanzas-equipo/${existing.editor_id}`);
  revalidatePath("/editor/finanzas");
  return { ok: true };
}
