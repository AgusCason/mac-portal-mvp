"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const CONTENT_STUDIO_PATH = "/admin/social-media/content-studio";

const ideaSchema = z.object({
  type: z.enum(["serie_social", "sesion_fotos", "video_script", "caption", "content_bank"]),
  title: z.string().min(2, "El título es obligatorio"),
  body: z.string().optional(),
  clientId: z.string().uuid().optional().or(z.literal("")),
});

function parseIdeaForm(formData: FormData) {
  const rawClientId = (formData.get("clientId") as string) || "";
  return ideaSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    clientId: rawClientId === "none" ? "" : rawClientId,
  });
}

/** Crea una idea/guión nuevo en el banco de Content Studio. */
export async function createContentIdeaAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = parseIdeaForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("content_ideas").insert({
    type: parsed.data.type,
    title: parsed.data.title,
    body: parsed.data.body || "",
    client_id: parsed.data.clientId || null,
    created_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(CONTENT_STUDIO_PATH);
  return { ok: true };
}

/** Edita una idea existente. */
export async function updateContentIdeaAction(ideaId: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseIdeaForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("content_ideas")
    .update({
      type: parsed.data.type,
      title: parsed.data.title,
      body: parsed.data.body || "",
      client_id: parsed.data.clientId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ideaId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(CONTENT_STUDIO_PATH);
  return { ok: true };
}

/** Elimina una idea. */
export async function deleteContentIdeaAction(ideaId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("content_ideas").delete().eq("id", ideaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(CONTENT_STUDIO_PATH);
  return { ok: true };
}
