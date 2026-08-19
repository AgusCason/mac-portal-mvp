"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const sendMessageSchema = z.object({
  clientId: z.string().uuid(),
  body: z.string().min(1),
});

/**
 * Envía un mensaje en el hilo de un cliente. RLS decide si el remitente
 * puede escribir ahí: admin siempre, editor solo con can_view_chat=true,
 * cliente solo en su propio hilo.
 *
 * NOTA: esto guarda el mensaje en Supabase para que aparezca en el CRM.
 * Para que también salga por WhatsApp real hace falta llamar a la
 * WhatsApp Cloud API acá (ver README § Módulo E) con el token de acceso
 * de la cuenta de negocio — no incluido en este scaffold.
 */
export async function sendChatMessageAction(formData: FormData) {
  const profile = await requireRole(["admin", "editor", "client"]);
  const parsed = sendMessageSchema.safeParse({
    clientId: formData.get("clientId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Mensaje inválido" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("chat_messages").insert({
    client_id: parsed.data.clientId,
    sender_profile_id: profile.id,
    direction: profile.role === "client" ? "inbound" : "outbound",
    body: parsed.data.body,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/chat");
  revalidatePath("/editor/chat");
  revalidatePath("/client/chat");
  return { ok: true };
}
