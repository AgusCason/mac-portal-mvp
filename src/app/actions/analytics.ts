"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const utmSchema = z.object({
  clientId: z.string().uuid().optional().or(z.literal("")),
  baseUrl: z.string().url("La URL base tiene que ser una URL válida"),
  utmSource: z.string().min(1, "La fuente (utm_source) es obligatoria"),
  utmMedium: z.string().min(1, "El medio (utm_medium) es obligatorio"),
  utmCampaign: z.string().min(1, "La campaña (utm_campaign) es obligatoria"),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
});

export type CreateUtmLinkResult =
  | { ok: true; generatedUrl: string }
  | { ok: false; error: string };

/** Analytics > UTM Builder — arma la URL con parámetros UTM y guarda el historial. */
export async function createUtmLinkAction(formData: FormData): Promise<CreateUtmLinkResult> {
  const admin = await requireAdmin();

  const parsed = utmSchema.safeParse({
    clientId: formData.get("clientId") ?? "",
    baseUrl: formData.get("baseUrl"),
    utmSource: formData.get("utmSource"),
    utmMedium: formData.get("utmMedium"),
    utmCampaign: formData.get("utmCampaign"),
    utmTerm: formData.get("utmTerm") ?? undefined,
    utmContent: formData.get("utmContent") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { clientId, baseUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = parsed.data;

  let generatedUrl: string;
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("utm_source", utmSource);
    url.searchParams.set("utm_medium", utmMedium);
    url.searchParams.set("utm_campaign", utmCampaign);
    if (utmTerm) url.searchParams.set("utm_term", utmTerm);
    if (utmContent) url.searchParams.set("utm_content", utmContent);
    generatedUrl = url.toString();
  } catch {
    return { ok: false, error: "No se pudo armar la URL — revisá la URL base" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("utm_links").insert({
    client_id: clientId || null,
    created_by: admin.id,
    base_url: baseUrl,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_term: utmTerm || null,
    utm_content: utmContent || null,
    generated_url: generatedUrl,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/analytics/utm-builder");
  return { ok: true, generatedUrl };
}

/** Borra una campaña UTM del historial. */
export async function deleteUtmLinkAction(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("utm_links").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/analytics/utm-builder");
  return { ok: true };
}
