"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { generateBrandVoiceSuggestion } from "@/lib/brand-voice-ai";

const BRAND_VOICE_PATH = "/admin/social-media/brand-voice";

const brandVoiceSchema = z.object({
  clientId: z.string().uuid(),
  tonePersonality: z.string().optional(),
  vocabulary: z.string().optional(),
  emojiRules: z.string().optional(),
  targetAudience: z.string().optional(),
  platformSettings: z.string().optional(),
});

/** Crea o actualiza la ficha de Brand Voice de una cuenta (upsert por client_id). */
export async function saveBrandVoiceAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = brandVoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    tonePersonality: formData.get("tonePersonality") ?? "",
    vocabulary: formData.get("vocabulary") ?? "",
    emojiRules: formData.get("emojiRules") ?? "",
    targetAudience: formData.get("targetAudience") ?? "",
    platformSettings: formData.get("platformSettings") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("client_brand_voice").upsert({
    client_id: parsed.data.clientId,
    tone_personality: parsed.data.tonePersonality || "",
    vocabulary: parsed.data.vocabulary || "",
    emoji_rules: parsed.data.emojiRules || "",
    target_audience: parsed.data.targetAudience || "",
    platform_settings: parsed.data.platformSettings || "",
    updated_by: admin.id,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(BRAND_VOICE_PATH);
  return { ok: true };
}

const FIELD_KEYS = ["tone_personality", "vocabulary", "emoji_rules", "target_audience", "platform_settings"] as const;

/** Pide a Claude un borrador para un campo puntual de la ficha ("AI AGENT"). */
export async function suggestBrandVoiceFieldAction(
  clientName: string,
  field: (typeof FIELD_KEYS)[number]
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  await requireAdmin();
  if (!FIELD_KEYS.includes(field)) return { ok: false, error: "Campo inválido." };

  try {
    const text = await generateBrandVoiceSuggestion(clientName, field);
    if (!text) return { ok: false, error: "Claude no devolvió una sugerencia." };
    return { ok: true, text };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo generar la sugerencia." };
  }
}
