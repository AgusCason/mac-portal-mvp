"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const planSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  priceMonthly: z.coerce.number().min(0),
  currency: z.enum(["ARS", "USD"]).default("ARS"),
  monthlyQuota: z.coerce.number().int().min(0).optional().or(z.nan()),
});

/** Crea un plan comercial. Información financiera — solo admin (RLS también lo exige). */
export async function createPlanAction(formData: FormData) {
  await requireAdmin();
  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    priceMonthly: formData.get("priceMonthly"),
    currency: formData.get("currency") || undefined,
    monthlyQuota: formData.get("monthlyQuota") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("plans").insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    price_monthly: parsed.data.priceMonthly,
    currency: parsed.data.currency,
    monthly_quota: Number.isFinite(parsed.data.monthlyQuota) ? parsed.data.monthlyQuota : null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/planes");
  return { ok: true };
}

/** Edita un plan comercial existente. Información financiera — solo admin (RLS también lo exige). */
export async function updatePlanAction(planId: string, formData: FormData) {
  await requireAdmin();
  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    priceMonthly: formData.get("priceMonthly"),
    currency: formData.get("currency") || undefined,
    monthlyQuota: formData.get("monthlyQuota") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: updatedRow, error } = await supabase
    .from("plans")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price_monthly: parsed.data.priceMonthly,
      currency: parsed.data.currency,
      monthly_quota: Number.isFinite(parsed.data.monthlyQuota) ? parsed.data.monthlyQuota : null,
    })
    .eq("id", planId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updatedRow) return { ok: false, error: "No se encontró el plan." };
  revalidatePath("/admin/planes");
  return { ok: true };
}
