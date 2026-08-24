"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Usá un color hex de 6 dígitos, ej: #2563EB");

const updateBrandingSchema = z.object({
  appName: z.string().min(1, "Ponele un nombre a la app"),
  logoLightUrl: z.string().url().optional().or(z.literal("")),
  logoDarkUrl: z.string().url().optional().or(z.literal("")),
  faviconUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: hexColor,
  accentColor: hexColor,
  buttonShape: z.enum(["square", "rounded", "pill"]),
});

/** Admin actualiza el branding white-label. Único que puede tocar la fila (RLS). */
export async function updateBrandingAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = updateBrandingSchema.safeParse({
    appName: formData.get("appName"),
    logoLightUrl: formData.get("logoLightUrl") ?? "",
    logoDarkUrl: formData.get("logoDarkUrl") ?? "",
    faviconUrl: formData.get("faviconUrl") ?? "",
    primaryColor: formData.get("primaryColor"),
    accentColor: formData.get("accentColor"),
    buttonShape: formData.get("buttonShape"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("agency_branding")
    .update({
      app_name: parsed.data.appName,
      logo_light_url: parsed.data.logoLightUrl || null,
      logo_dark_url: parsed.data.logoDarkUrl || null,
      favicon_url: parsed.data.faviconUrl || null,
      primary_color: parsed.data.primaryColor,
      accent_color: parsed.data.accentColor,
      button_shape: parsed.data.buttonShape,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { ok: false, error: error.message };
  // Layout raíz: afecta el <style> con los CSS custom properties en TODA la app.
  revalidatePath("/", "layout");
  return { ok: true };
}
