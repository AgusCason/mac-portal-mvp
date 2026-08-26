"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fullName: z.string().min(2, "El nombre es obligatorio"),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
});

/** "Perfil de Cuenta" — datos personales del usuario logueado (cualquier rol). */
export async function updateMyProfileAction(formData: FormData) {
  const me = await requireRole();
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    jobTitle: formData.get("jobTitle") ?? "",
    phone: formData.get("phone") ?? "",
    location: formData.get("location") ?? "",
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      job_title: parsed.data.jobTitle || "",
      phone: parsed.data.phone || "",
      location: parsed.data.location || "",
      bio: parsed.data.bio || "",
    })
    .eq("id", me.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

const preferencesSchema = z.object({
  language: z.enum(["es", "en", "pt"]),
  numberFormat: z.enum(["es_latam", "en_us"]),
  theme: z.enum(["midnight_dark", "modern_mix", "pure_light", "psychedelic"]),
});

/** "Preferencias" — idioma, formato numérico y tema. */
export async function updateMyPreferencesAction(formData: FormData) {
  const me = await requireRole();
  const parsed = preferencesSchema.safeParse({
    language: formData.get("language"),
    numberFormat: formData.get("numberFormat"),
    theme: formData.get("theme"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      language: parsed.data.language,
      number_format: parsed.data.numberFormat,
      theme_preference: parsed.data.theme,
    })
    .eq("id", me.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Selector rápido de idioma en el panel de Settings — no exige reenviar todas las Preferencias. */
export async function updateMyLanguageAction(language: "es" | "en" | "pt") {
  const me = await requireRole();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ language }).eq("id", me.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** "Notificaciones" — Alertas de Seguridad es obligatorio, nunca se guarda como false. */
export async function updateMyNotificationsAction(marketing: boolean, productUpdates: boolean) {
  const me = await requireRole();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ notify_marketing: marketing, notify_product_updates: productUpdates })
    .eq("id", me.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
