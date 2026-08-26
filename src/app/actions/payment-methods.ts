"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { PaymentMethodKind } from "@/types/database";

const PLANES_PATH = "/admin/planes";

const emptyToNull = (v: FormDataEntryValue | null) => {
  const s = (v as string | null)?.trim();
  return s ? s : null;
};

const paymentMethodSchema = z.object({
  enabled: z.boolean(),
  paymentLink: z.string().optional().nullable(),
  accountHolder: z.string().optional().nullable(),
  cuit: z.string().optional().nullable(),
  cbu: z.string().optional().nullable(),
  alias: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAddress: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  routingNumber: z.string().optional().nullable(),
  swiftBic: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * Actualiza UN método de cobro (Configuración > Planes y facturación >
 * Métodos de cobro) — Nivel 1: solo guarda el link de pago (generado a mano
 * en el dashboard de cada plataforma) o los datos de transferencia, según el
 * `kind`. Las 5 filas ya existen (sembradas por 0025_payment_methods.sql),
 * así que esto siempre es un update, nunca un insert.
 */
export async function updatePaymentMethodAction(kind: PaymentMethodKind, formData: FormData) {
  const admin = await requireAdmin();
  const parsed = paymentMethodSchema.safeParse({
    enabled: formData.get("enabled") === "on",
    paymentLink: emptyToNull(formData.get("paymentLink")),
    accountHolder: emptyToNull(formData.get("accountHolder")),
    cuit: emptyToNull(formData.get("cuit")),
    cbu: emptyToNull(formData.get("cbu")),
    alias: emptyToNull(formData.get("alias")),
    bankName: emptyToNull(formData.get("bankName")),
    bankAddress: emptyToNull(formData.get("bankAddress")),
    accountNumber: emptyToNull(formData.get("accountNumber")),
    routingNumber: emptyToNull(formData.get("routingNumber")),
    swiftBic: emptyToNull(formData.get("swiftBic")),
    notes: emptyToNull(formData.get("notes")),
  });

  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const d = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("payment_methods")
    .update({
      enabled: d.enabled,
      payment_link: d.paymentLink,
      account_holder: d.accountHolder,
      cuit: d.cuit,
      cbu: d.cbu,
      alias: d.alias,
      bank_name: d.bankName,
      bank_address: d.bankAddress,
      account_number: d.accountNumber,
      routing_number: d.routingNumber,
      swift_bic: d.swiftBic,
      notes: d.notes,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    })
    .eq("kind", kind);

  if (error) return { ok: false, error: error.message };
  revalidatePath(PLANES_PATH);
  return { ok: true };
}
