import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/types/database";

export interface ChatMessageWithSender extends ChatMessage {
  sender_name: string | null;
}

/** Mensajes del hilo de un cliente, ordenados del más viejo al más nuevo. */
export async function getChatMessages(clientId: string): Promise<ChatMessageWithSender[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*, profiles(full_name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getChatMessages]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const { profiles, ...rest } = row as ChatMessage & {
      profiles: { full_name: string } | null;
    };
    return { ...rest, sender_name: profiles?.full_name ?? null };
  });
}
