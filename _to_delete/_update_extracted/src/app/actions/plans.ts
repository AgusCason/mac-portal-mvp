"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const planSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  priceMonthly: z.coerce.number().min(0),
  monthlyQuota: z.coerce.number().int().min(0).optional().or(z.nan()),
});

/** Crea un plan comercial. Información financiera — solo admin (RLS también lo exige). */
export async function createPlanAction(formData: FormData) {
  await requireAdmin();
  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    priceMonthly: formData.get("priceMonthly"),
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
    monthly_quota: Number.isFinite(parsed.data.monthlyQuota) ? parsed.data.monthlyQuota : null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/planes");
  return { ok: true };
}
