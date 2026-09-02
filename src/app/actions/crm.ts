"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { optionalPhoneSchema } from "@/lib/validation";
import type { CrmLeadStage } from "@/types/database";

const STAGES: [CrmLeadStage, ...CrmLeadStage[]] = [
  "nuevo",
  "contactado",
  "calificado",
  "propuesta",
  "ganado",
  "perdido",
];

const leadSchema = z.object({
  name: z.string().min(1, "Ponele un nombre al prospecto"),
  contactName: z.string().optional(),
  contactEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  contactPhone: optionalPhoneSchema,
  source: z.string().optional(),
  estimatedValue: z.coerce.number().nonnegative().optional().or(z.nan()),
  notes: z.string().optional(),
});

/** Alta de un prospecto — arranca siempre en "Nuevo". Solo admin (CRM interno). */
export async function createLeadAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName") ?? undefined,
    contactEmail: formData.get("contactEmail") ?? "",
    contactPhone: formData.get("contactPhone") ?? undefined,
    source: formData.get("source") ?? undefined,
    estimatedValue: formData.get("estimatedValue") || undefined,
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("crm_leads").insert({
    name: parsed.data.name,
    contact_name: parsed.data.contactName || null,
    contact_email: parsed.data.contactEmail || null,
    contact_phone: parsed.data.contactPhone || null,
    source: parsed.data.source || null,
    estimated_value: Number.isFinite(parsed.data.estimatedValue)
      ? parsed.data.estimatedValue
      : null,
    notes: parsed.data.notes || null,
    created_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/crm");
  return { ok: true };
}

/** Edita los datos de un prospecto existente (no toca su etapa). */
export async function updateLeadAction(leadId: string, formData: FormData) {
  await requireAdmin();
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName") ?? undefined,
    contactEmail: formData.get("contactEmail") ?? "",
    contactPhone: formData.get("contactPhone") ?? undefined,
    source: formData.get("source") ?? undefined,
    estimatedValue: formData.get("estimatedValue") || undefined,
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("crm_leads")
    .update({
      name: parsed.data.name,
      contact_name: parsed.data.contactName || null,
      contact_email: parsed.data.contactEmail || null,
      contact_phone: parsed.data.contactPhone || null,
      source: parsed.data.source || null,
      estimated_value: Number.isFinite(parsed.data.estimatedValue)
        ? parsed.data.estimatedValue
        : null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/crm");
  return { ok: true };
}

/** Mueve un prospecto de etapa (drag-and-drop o botón). */
export async function updateLeadStageAction(leadId: string, stage: CrmLeadStage) {
  await requireAdmin();
  if (!STAGES.includes(stage)) return { ok: false, error: "Etapa inválida" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("crm_leads")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/crm");
  return { ok: true };
}

/** Borra un prospecto del pipeline (ej: quedó duplicado). */
export async function deleteLeadAction(leadId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("crm_leads").delete().eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/crm");
  return { ok: true };
}
