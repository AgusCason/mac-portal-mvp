"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const COMPETIDORES_PATH = "/admin/social-media/competidores";

const competitorSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  platform: z.enum(["instagram", "tiktok", "youtube"]),
  handle: z.string().optional(),
  clientId: z.string().uuid().optional().or(z.literal("")),
  followersCount: z.coerce.number().int().min(0).optional().or(z.literal("")),
  engagementRate: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  notes: z.string().optional(),
});

function parseCompetitorForm(formData: FormData) {
  const rawClientId = (formData.get("clientId") as string) || "";
  return competitorSchema.safeParse({
    name: formData.get("name"),
    platform: formData.get("platform"),
    handle: formData.get("handle") ?? "",
    clientId: rawClientId === "none" ? "" : rawClientId,
    followersCount: formData.get("followersCount") || "",
    engagementRate: formData.get("engagementRate") || "",
    notes: formData.get("notes") ?? "",
  });
}

/** Crea un competidor nuevo. */
export async function createCompetitorAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = parseCompetitorForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("competitors").insert({
    name: parsed.data.name,
    platform: parsed.data.platform,
    handle: parsed.data.handle || "",
    client_id: parsed.data.clientId || null,
    followers_count: parsed.data.followersCount === "" ? null : (parsed.data.followersCount as number),
    engagement_rate: parsed.data.engagementRate === "" ? null : (parsed.data.engagementRate as number),
    notes: parsed.data.notes || "",
    created_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(COMPETIDORES_PATH);
  return { ok: true };
}

/** Edita un competidor existente. */
export async function updateCompetitorAction(competitorId: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseCompetitorForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("competitors")
    .update({
      name: parsed.data.name,
      platform: parsed.data.platform,
      handle: parsed.data.handle || "",
      client_id: parsed.data.clientId || null,
      followers_count: parsed.data.followersCount === "" ? null : (parsed.data.followersCount as number),
      engagement_rate: parsed.data.engagementRate === "" ? null : (parsed.data.engagementRate as number),
      notes: parsed.data.notes || "",
    })
    .eq("id", competitorId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(COMPETIDORES_PATH);
  return { ok: true };
}

/** Elimina un competidor. */
export async function deleteCompetitorAction(competitorId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("competitors").delete().eq("id", competitorId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(COMPETIDORES_PATH);
  return { ok: true };
}
