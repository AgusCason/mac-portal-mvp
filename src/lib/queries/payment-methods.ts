import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethodConfig, PaymentMethodKind } from "@/types/database";

/**
 * Config de cobro de la agencia (Configuración > Planes y facturación >
 * Métodos de cobro): siempre las 5 keys de `PaymentMethodKind`, sembradas por
 * 0025_payment_methods.sql. RLS ya excluye al editor (mismo criterio que
 * billing_invoices) — admin y cliente sí pueden leerla.
 */
export async function getPaymentMethods(): Promise<
  Record<PaymentMethodKind, PaymentMethodConfig | undefined>
> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("payment_methods").select("*");
  if (error) {
    console.error("[getPaymentMethods]", error.message);
    return {} as Record<PaymentMethodKind, PaymentMethodConfig | undefined>;
  }
  return Object.fromEntries((data ?? []).map((row) => [row.kind, row])) as Record<
    PaymentMethodKind,
    PaymentMethodConfig | undefined
  >;
}

/** Solo los métodos habilitados — lo que consume la pantalla de Pagar del cliente. */
export async function getEnabledPaymentMethods(): Promise<PaymentMethodConfig[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("enabled", true);
  if (error) {
    console.error("[getEnabledPaymentMethods]", error.message);
    return [];
  }
  return data ?? [];
}
