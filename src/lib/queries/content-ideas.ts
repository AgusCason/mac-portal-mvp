import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ContentIdea } from "@/types/database";

export interface ContentIdeaWithClient extends ContentIdea {
  client_name: string | null;
}

/** Social Media > Content Studio — banco de ideas/guiones, todos los tipos. */
export async function getContentIdeas(): Promise<ContentIdeaWithClient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_ideas")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getContentIdeas]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const typed = row as unknown as ContentIdea & { clients: { name: string } | null };
    const { clients, ...rest } = typed;
    return { ...rest, client_name: clients?.name ?? null };
  });
}
