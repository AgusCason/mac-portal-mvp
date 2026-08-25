"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import type { ContentCategory, ContentNetwork, ContentStatus } from "@/types/database";

const deliverContentSchema = z.object({
  contentId: z.string().uuid(),
  driveFileId: z.string().min(1, "Falta el archivo subido a Drive"),
  thumbnailUrl: z.string().optional(),
});

const createContentSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional(),
  network: z.string(),
  category: z.string().optional(),
  scheduledAt: z.string().optional(),
});

/**
 * Crea una pieza de contenido en el calendario editorial (Admin o Editor).
 * RLS valida además, a nivel de base, que el editor esté asignado al cliente.
 */
export async function createContentItemAction(formData: FormData) {
  const profile = await requireRole(["admin", "editor"]);
  const rawCategory = formData.get("category");
  const parsed = createContentSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    network: formData.get("network"),
    // El Select de categoría usa "none" como placeholder de "sin categoría" —
    // hay que traducirlo a "" antes de que llegue a zod (ver AGENTS.md /
    // convención ya aplicada en contacts.ts, tasks.ts, competitors.ts).
    category: rawCategory === "none" ? "" : (rawCategory ?? undefined),
    scheduledAt: formData.get("scheduledAt") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { clientId, title, description, network, category, scheduledAt } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("content_items").insert({
    client_id: clientId,
    title,
    description: description || null,
    network: network as ContentNetwork,
    category: (category || null) as ContentCategory | null,
    scheduled_at: scheduledAt || null,
    created_by: profile.id,
    assigned_editor_id: profile.role === "editor" ? profile.id : null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/calendario");
  revalidatePath("/editor/calendario");
  revalidatePath("/client/calendario");
  revalidatePath("/admin/social-media/planner");
  return { ok: true };
}

/**
 * Admin/Editor mueven una pieza a través del flujo Borrador → ... → Publicado.
 * Acepta cualquier ContentStatus (incluye aprobado/requiere_cambios): a
 * diferencia del cliente, admin/editor sí pueden setear el estado libremente,
 * no solo vía la RPC de aprobación.
 */
export async function updateContentStatusAction(
  contentId: string,
  status: ContentStatus
) {
  await requireRole(["admin", "editor"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("content_items")
    .update({ status })
    .eq("id", contentId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/calendario");
  revalidatePath("/editor/calendario");
  revalidatePath("/client/calendario");
  revalidatePath("/admin/social-media/planner");
  return { ok: true };
}

/**
 * Modal de entrega del editor: el archivo ya se subió a la carpeta
 * "Entregables Finales" del cliente en Drive (ver `createUploadSessionAction`
 * en `app/actions/drive.ts`, que devuelve la URL de sesión resumable que el
 * navegador usa para subir el archivo directo a Google). Esta acción solo
 * registra el `drive_file_id` resultante en la pieza y la transiciona
 * automáticamente a "Por Aprobar" — es el paso que activa la revisión del
 * cliente (y, más adelante, el aviso de WhatsApp de la Tarea #22).
 */
export async function deliverContentAction(formData: FormData) {
  await requireRole(["admin", "editor"]);
  const parsed = deliverContentSchema.safeParse({
    contentId: formData.get("contentId"),
    driveFileId: formData.get("driveFileId"),
    thumbnailUrl: formData.get("thumbnailUrl") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: updated, error } = await supabase
    .from("content_items")
    .update({
      drive_file_id: parsed.data.driveFileId,
      thumbnail_url: parsed.data.thumbnailUrl || null,
      status: "por_aprobar",
    })
    .eq("id", parsed.data.contentId)
    .select("id, title, client_id")
    .single();

  if (error) return { ok: false, error: error.message };

  // Avisa al cliente por WhatsApp que tiene una pieza nueva para revisar.
  // Best-effort: si no está configurado WhatsApp o falla el envío, la
  // entrega ya quedó guardada — no rompemos el flujo por esto.
  if (updated) {
    const { data: client } = await supabase
      .from("clients")
      .select("contact_phone")
      .eq("id", updated.client_id)
      .maybeSingle();
    if (client?.contact_phone) {
      const result = await sendWhatsAppMessage(
        client.contact_phone,
        `¡Tenés una pieza nueva para revisar! "${updated.title}" está lista para tu aprobación en el portal.`
      );
      if (result.ok) {
        await supabase.from("chat_messages").insert({
          client_id: updated.client_id,
          direction: "outbound",
          body: `[Automático] Pieza lista para revisión: "${updated.title}"`,
          whatsapp_message_id: result.messageId || null,
        });
      }
    }
  }

  revalidatePath("/admin/calendario");
  revalidatePath("/editor/calendario");
  revalidatePath("/client/calendario");
  revalidatePath("/admin/social-media/planner");
  return { ok: true };
}

/**
 * El cliente aprueba una pieza o pide cambios con feedback puntual.
 * Pasa por la RPC `set_content_approval` (security definer) en vez de un
 * UPDATE directo: así el cliente solo puede tocar el campo `status` con los
 * dos valores permitidos, nunca el resto de la fila.
 */
export async function reviewContentAction(
  contentId: string,
  decision: "aprobado" | "requiere_cambios",
  feedback?: string
) {
  await requireRole(["client"]);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("set_content_approval", {
    target_content_id: contentId,
    new_status: decision,
    feedback: feedback ?? null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/client/calendario");
  revalidatePath("/admin/calendario");
  revalidatePath("/editor/calendario");
  return { ok: true };
}
