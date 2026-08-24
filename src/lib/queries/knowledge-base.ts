import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { KbArticle } from "@/types/database";

export interface KbArticleWithFavorite extends KbArticle {
  is_favorite: boolean;
}

/** Management > Knowledge Base — artículos internos, fijados primero. */
export async function getKbArticles(profileId: string): Promise<KbArticleWithFavorite[]> {
  const supabase = await createClient();
  const [{ data: articles, error }, { data: favorites }] = await Promise.all([
    supabase
      .from("kb_articles")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("kb_article_favorites").select("article_id").eq("profile_id", profileId),
  ]);

  if (error) {
    console.error("[getKbArticles]", error.message);
    return [];
  }

  const favoriteIds = new Set((favorites ?? []).map((f) => f.article_id));
  return (articles ?? []).map((article) => ({ ...article, is_favorite: favoriteIds.has(article.id) }));
}

export async function getKbArticle(articleId: string): Promise<KbArticle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("kb_articles").select("*").eq("id", articleId).maybeSingle();
  if (error) {
    console.error("[getKbArticle]", error.message);
    return null;
  }
  return data;
}
