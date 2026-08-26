import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { FormSubmission, WebForm } from "@/types/database";

export interface WebFormWithCount extends WebForm {
  submission_count: number;
}

/** Management > Web Forms — listado admin con conteo de respuestas. */
export async function getWebForms(limit = 300): Promise<WebFormWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("web_forms")
    .select("*, form_submissions(id)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getWebForms]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const typed = row as unknown as WebForm & { form_submissions: { id: string }[] };
    const { form_submissions, ...rest } = typed;
    return { ...rest, submission_count: form_submissions?.length ?? 0 };
  });
}

export async function getWebFormSubmissions(formId: string, limit = 500): Promise<FormSubmission[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("form_id", formId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getWebFormSubmissions]", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Lectura PÚBLICA (sin sesión) para renderizar `/f/[id]`. Solo puede
 * devolver formularios activos — lo garantiza la policy
 * `web_forms_public_select_active` de la migración 0017, no este código.
 */
export async function getPublicWebForm(formId: string): Promise<WebForm | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("web_forms").select("*").eq("id", formId).maybeSingle();
  if (error) {
    console.error("[getPublicWebForm]", error.message);
    return null;
  }
  return data;
}
