"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const WEB_FORMS_PATH = "/admin/web-forms";

const formSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  description: z.string().optional(),
});

/** Crea un formulario nuevo. */
export async function createWebFormAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = formSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("web_forms").insert({
    name: parsed.data.name,
    description: parsed.data.description || "",
    created_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(WEB_FORMS_PATH);
  return { ok: true };
}

/** Activa/desactiva un formulario (cuando está inactivo, deja de aceptar respuestas). */
export async function toggleWebFormActiveAction(formId: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("web_forms").update({ is_active: isActive }).eq("id", formId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(WEB_FORMS_PATH);
  return { ok: true };
}

/** Elimina un formulario (y sus respuestas, en cascada). */
export async function deleteWebFormAction(formId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("web_forms").delete().eq("id", formId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(WEB_FORMS_PATH);
  return { ok: true };
}

const submissionSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Ingresá un email válido"),
  message: z.string().optional(),
});

/**
 * Envía una respuesta a un formulario PÚBLICO (`/f/[id]`) — sin sesión.
 * La policy `form_submissions_public_insert` de la migración 0017 es la
 * que realmente autoriza el insert (solo si el form existe y está activo);
 * este código no depende de ningún chequeo de rol.
 */
export async function submitWebFormAction(
  formId: string,
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = submissionSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();

  // Rate limit por IP + formulario: sin sesión de por medio (es la página
  // pública /f/[id]), así que la única defensa contra un bot mandando spam
  // es esto — bloqueo automático temporal si se pasa (ver 0027_security_hardening.sql).
  const ip = await getClientIp();
  const allowed = await checkRateLimit(supabase, `webform:${formId}:${ip}`, {
    maxHits: 5,
    windowSeconds: 600,
    blockMinutes: 60,
  });
  if (!allowed) {
    return { ok: false, error: "Demasiados envíos seguidos. Probá de nuevo más tarde." };
  }

  const { error } = await supabase.from("form_submissions").insert({
    form_id: formId,
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message || "",
  });

  if (error) return { ok: false, error: "No se pudo enviar el formulario. Probá de nuevo." };
  return { ok: true };
}
