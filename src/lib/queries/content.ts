import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ContentItem } from "@/types/database";

export interface ContentItemWithClient extends ContentItem {
  client_name: string;
}

/**
 * Lista piezas de contenido. RLS ya acota el resultado según quién pregunta
 * (admin: todas: editor: solo clientes asignados; cliente: solo lo suyo) —
 * por eso esta única query sirve para las tres vistas del calendario.
 */
export async function getContentItems(
  clientId?: string,
  limit = 500
): Promise<ContentItemWithClient[]> {
  const supabase = await createClient();
  let query = supabase
    .from("content_items")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) {
    console.error("[getContentItems]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const { clients, ...rest } = row as ContentItem & { clients: { name: string } | null };
    return { ...rest, client_name: clients?.name ?? "—" };
  });
}

/** Clientes que el usuario actual puede seleccionar al crear contenido (RLS-aware). */
export async function getSelectableClients(
  limit = 500
): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("id, name").order("name").limit(limit);
  return data ?? [];
}
