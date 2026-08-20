"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { runAssistantTurn } from "@/lib/ai/client";
import { executeAction, previewAction, isKnownActionType } from "@/lib/ai/actions-registry";

/**
 * Server Actions del Asistente IA. Todo pasa por requireAdmin() — ni editores
 * ni clientes pueden llamar a nada de acá (y aunque llegaran a intentarlo,
 * RLS en ai_conversations/ai_messages/ai_audit_log lo bloquea igual).
 *
 * Estas tres funciones son el único camino de punta a punta:
 *   sendAiMessageAction    → habla con Claude, nunca muta datos.
 *   confirmAiActionAction  → el ÚNICO lugar de toda la app donde una
 *                            propuesta de la IA se convierte en una
 *                            mutación real — solo tras clic humano.
 *   rejectAiActionAction   → descarta la propuesta sin aplicarla.
 */

const sendMessageSchema = z.object({
  conversationId: z.string().uuid().nullable(),
  message: z.string().min(1, "El mensaje no puede estar vacío").max(4000),
});

export type SendAiMessageResult =
  | { ok: true; conversationId: string; assistantText: string; hasPendingAction: boolean }
  | { ok: false; error: string };

/**
 * Manda un mensaje del admin al asistente y corre el loop de tools hasta que
 * Claude termine con texto normal o con una propuesta de cambio. Si hay
 * propuesta, queda guardada en `ai_messages.pending_action` + un registro
 * `ai_audit_log` en estado "proposed" — nada se aplica todavía.
 */
export async function sendAiMessageAction(
  conversationIdInput: string | null,
  message: string
): Promise<SendAiMessageResult> {
  const admin = await requireAdmin();

  const parsed = sendMessageSchema.safeParse({ conversationId: conversationIdInput, message });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Mensaje inválido" };
  }

  const supabase = await createSupabaseServerClient();

  // 1. Conversación: crear una nueva si no se pasó id.
  let conversationId = parsed.data.conversationId;
  if (!conversationId) {
    const { data: conv, error } = await supabase
      .from("ai_conversations")
      .insert({ admin_id: admin.id, title: parsed.data.message.slice(0, 60) })
      .select("id")
      .single();
    if (error || !conv) {
      return { ok: false, error: error?.message ?? "No se pudo crear la conversación." };
    }
    conversationId = conv.id;
  }

  // 2. Historial previo (texto plano) para darle contexto a Claude.
  const { data: priorRows } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(40);

  const history = (priorRows ?? [])
    .filter((m): m is { role: "user" | "assistant"; content: string } => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  // 3. Guardar el mensaje del admin.
  const { error: userMsgError } = await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: parsed.data.message,
  });
  if (userMsgError) return { ok: false, error: userMsgError.message };

  // 4. Correr el turno del asistente (lee con el cliente del propio admin — RLS como piso).
  let turn;
  try {
    turn = await runAssistantTurn(supabase, admin, history, parsed.data.message);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error inesperado llamando al asistente.",
    };
  }

  // 5. Si Claude propuso un cambio, dejarlo en auditoría ANTES de guardar el
  //    mensaje, para poder linkear audit_log_id desde ai_messages.
  let auditLogId: string | null = null;
  if (turn.proposal) {
    let diff: Record<string, unknown> = { payload: turn.proposal.payload };
    if (isKnownActionType(turn.proposal.action_type)) {
      const preview = await previewAction(
        turn.proposal.action_type,
        turn.proposal.target_id,
        turn.proposal.payload,
        supabase
      );
      if (!("error" in preview)) diff = { before: preview.before, after: preview.after };
    }

    const { data: auditRow, error: auditError } = await supabase
      .from("ai_audit_log")
      .insert({
        admin_id: admin.id,
        conversation_id: conversationId,
        action_type: turn.proposal.action_type,
        target_table: turn.proposal.target_table,
        target_id: turn.proposal.target_id,
        summary: turn.proposal.summary,
        diff,
        status: "proposed",
      })
      .select("id")
      .single();
    if (auditError) return { ok: false, error: auditError.message };
    auditLogId = auditRow?.id ?? null;
  }

  // 6. Guardar la respuesta del asistente, con la propuesta embebida si la hay.
  const { error: assistantMsgError } = await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: turn.assistantText,
    pending_action: turn.proposal,
    audit_log_id: auditLogId,
  });
  if (assistantMsgError) return { ok: false, error: assistantMsgError.message };

  revalidatePath("/admin/asistente");

  return {
    ok: true,
    conversationId,
    assistantText: turn.assistantText,
    hasPendingAction: Boolean(turn.proposal),
  };
}

export type ConfirmAiActionResult = { ok: true; summary: string } | { ok: false; error: string };

/**
 * Ejecuta de verdad una propuesta pendiente. Es el ÚNICO lugar en toda la
 * app donde una acción generada por la IA se aplica — y solo corre después
 * de que el admin hizo clic en "Confirmar" en la tarjeta de propuesta. Usa
 * el mismo `executeAction` (catálogo cerrado, validado con zod) que
 * ejecutaría cualquier otra mutación administrativa manual.
 */
export async function confirmAiActionAction(messageId: string): Promise<ConfirmAiActionResult> {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: msg, error: msgError } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("id", messageId)
    .single();
  if (msgError || !msg) return { ok: false, error: "Mensaje no encontrado." };
  if (!msg.pending_action || !msg.audit_log_id) {
    return { ok: false, error: "Este mensaje no tiene ninguna propuesta pendiente." };
  }

  const { action_type, target_id, payload } = msg.pending_action;
  if (!isKnownActionType(action_type)) {
    return { ok: false, error: "Tipo de acción desconocido." };
  }

  const result = await executeAction(action_type, target_id, payload, supabase);

  await supabase
    .from("ai_audit_log")
    .update({
      status: result.ok ? "executed" : "failed",
      error: result.ok ? null : result.error,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", msg.audit_log_id)
    .eq("admin_id", admin.id);

  await supabase.from("ai_messages").update({ pending_action: null }).eq("id", messageId);

  revalidatePath("/admin/asistente");

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, summary: result.summary };
}

/** Descarta una propuesta sin aplicarla nunca — el audit log queda como "rejected". */
export async function rejectAiActionAction(
  messageId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: msg, error: msgError } = await supabase
    .from("ai_messages")
    .select("audit_log_id, pending_action")
    .eq("id", messageId)
    .single();
  if (msgError || !msg) return { ok: false, error: "Mensaje no encontrado." };
  if (!msg.pending_action) {
    return { ok: false, error: "Este mensaje no tiene ninguna propuesta pendiente." };
  }

  if (msg.audit_log_id) {
    await supabase
      .from("ai_audit_log")
      .update({ status: "rejected", resolved_at: new Date().toISOString() })
      .eq("id", msg.audit_log_id)
      .eq("admin_id", admin.id);
  }

  await supabase.from("ai_messages").update({ pending_action: null }).eq("id", messageId);

  revalidatePath("/admin/asistente");
  return { ok: true };
}
