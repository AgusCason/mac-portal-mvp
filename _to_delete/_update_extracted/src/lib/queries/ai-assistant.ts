import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AiAuditLog, AiConversation, AiMessage } from "@/types/database";

/**
 * Todas las funciones de acá corren con el cliente de Supabase del usuario
 * logueado (RLS-aware) — nunca con la Service Role Key. Como las policies de
 * `ai_conversations`/`ai_messages` ya restringen todo a `admin_id = auth.uid()`,
 * ni siquiera hace falta filtrar por admin acá: si alguien que no es el dueño
 * (o no es admin) llama a esto, simplemente no ve filas.
 */

/** Últimas conversaciones del admin logueado, para el listado lateral del chat. */
export async function listAiConversations(): Promise<AiConversation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[listAiConversations]", error.message);
    return [];
  }
  return data ?? [];
}

/** Trae una conversación puntual (o null si no existe / no es del admin actual). */
export async function getAiConversation(conversationId: string): Promise<AiConversation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    console.error("[getAiConversation]", error.message);
    return null;
  }
  return data;
}

/** Mensajes de un hilo, del más viejo al más nuevo — incluye la propuesta pendiente si la hay. */
export async function getAiMessages(conversationId: string): Promise<AiMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getAiMessages]", error.message);
    return [];
  }
  return data ?? [];
}

/** Historial de auditoría más reciente primero, para la tabla de "qué hizo la IA". */
export async function listAiAuditLog(limit = 50): Promise<AiAuditLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[listAiAuditLog]", error.message);
    return [];
  }
  return data ?? [];
}
