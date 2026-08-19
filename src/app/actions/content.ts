"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentNetwork, ContentStatus } from "@/types/database";

const createContentSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional(),
  network: z.string(),
  scheduledAt: z.string().optional(),
});

/**
 * Crea una pieza de contenido en el calendario editorial (Admin o Editor).
 * RLS valida además, a nivel de base, que el editor esté asignado al cliente.
 */
export async function createContentItemAction(formData: FormData) {
  const profile = await requireRole(["admin", "editor"]);
  const parsed = createContentSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    network: formData.get("network"),
    scheduledAt: formData.get("scheduledAt") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { clientId, title, description, network, scheduledAt } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("content_items").insert({
    client_id: clientId,
    title,
    description: description || null,
    network: network as ContentNetwork,
    scheduled_at: scheduledAt || null,
    created_by: profile.id,
    assigned_editor_id: profile.role === "editor" ? profile.id : null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/calendario");
  revalidatePath("/editor/calendario");
  revalidatePath("/client/calendario");
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
