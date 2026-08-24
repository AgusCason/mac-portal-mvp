"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const KB_PATH = "/admin/knowledge-base";

const articleSchema = z.object({
  title: z.string().min(2, "El título es obligatorio"),
  body: z.string().min(1, "El contenido es obligatorio"),
  isPinned: z.boolean().default(false),
});

function parseArticleForm(formData: FormData) {
  return articleSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    isPinned: formData.get("isPinned") === "on",
  });
}

/** Crea un artículo nuevo. */
export async function createKbArticleAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = parseArticleForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("kb_articles")
    .insert({
      title: parsed.data.title,
      body: parsed.data.body,
      is_pinned: parsed.data.isPinned,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "No se pudo crear el artículo." };
  revalidatePath(KB_PATH);
  return { ok: true, articleId: data.id };
}

/** Edita un artículo existente. */
export async function updateKbArticleAction(articleId: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseArticleForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("kb_articles")
    .update({
      title: parsed.data.title,
      body: parsed.data.body,
      is_pinned: parsed.data.isPinned,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(KB_PATH);
  return { ok: true };
}

/** Elimina un artículo. */
export async function deleteKbArticleAction(articleId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("kb_articles").delete().eq("id", articleId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(KB_PATH);
  return { ok: true };
}

/** Suma una vista (best-effort, no bloquea si falla). */
export async function incrementKbViewsAction(articleId: string, currentViews: number) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  await supabase.from("kb_articles").update({ views_count: currentViews + 1 }).eq("id", articleId);
  return { ok: true };
}

/** Marca/desmarca un artículo como favorito del usuario logueado. */
export async function toggleKbFavoriteAction(articleId: string, makeFavorite: boolean) {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = makeFavorite
    ? await supabase.from("kb_article_favorites").insert({ profile_id: admin.id, article_id: articleId })
    : await supabase
        .from("kb_article_favorites")
        .delete()
        .eq("profile_id", admin.id)
        .eq("article_id", articleId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(KB_PATH);
  return { ok: true };
}
