"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export interface AssignEditorInput {
  editorId: string;
  clientId: string;
  canViewChat: boolean;
  canViewDrive: boolean;
}

/**
 * Asigna (o actualiza) un editor a un cliente con permisos granulares.
 * Solo el admin puede ejecutar esta acción — así se cumple la regla de
 * "asignación granular de editores a clientes con permisos específicos".
 */
export async function assignEditorToClientAction(input: AssignEditorInput) {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("editor_client_assignments").upsert(
    {
      editor_id: input.editorId,
      client_id: input.clientId,
      can_view_chat: input.canViewChat,
      can_view_drive: input.canViewDrive,
      assigned_by: admin.id,
    },
    { onConflict: "editor_id,client_id" }
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/equipo");
  revalidatePath(`/admin/clientes/${input.clientId}`);
  return { ok: true };
}

/** Quita a un editor de un cliente. Solo admin. */
export async function unassignEditorAction(assignmentId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("editor_client_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/equipo");
  return { ok: true };
}
