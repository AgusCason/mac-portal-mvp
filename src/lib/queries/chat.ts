import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/types/database";

export interface ChatMessageWithSender extends ChatMessage {
  sender_name: string | null;
}

/**
 * Últimos `limit` mensajes del hilo de un cliente, ordenados del más viejo
 * al más nuevo. Un hilo activo puede acumular miles de mensajes con el
 * tiempo — se trae la cola más reciente (orden descendente + limit) y se
 * da vuelta en memoria, en vez de traer el historial completo cada vez.
 */
export async function getChatMessages(
  clientId: string,
  limit = 200
): Promise<ChatMessageWithSender[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*, profiles(full_name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getChatMessages]", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const { profiles, ...rest } = row as ChatMessage & {
        profiles: { full_name: string } | null;
      };
      return { ...rest, sender_name: profiles?.full_name ?? null };
    })
    .reverse();
}
