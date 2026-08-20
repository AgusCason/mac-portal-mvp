"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { inviteOrReuseUser } from "@/lib/onboarding";

const createEditorSchema = z.object({
  fullName: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
});

export type CreateEditorResult =
  | { ok: true; profileId: string; alreadyExisted: boolean }
  | { ok: false; error: string };

/**
 * Alta de Editor (Admin) — aprovisionamiento automático: invita por email vía
 * Supabase Auth Admin API con role=editor; el trigger `handle_new_user` crea
 * su `profiles`. Deja el perfil listo para asignar a clientes desde
 * `assignEditorToClientAction` (el editor NO ve nada hasta que se le asigne
 * al menos un cliente).
 */
export async function createEditorAction(formData: FormData): Promise<CreateEditorResult> {
  await requireAdmin();

  const parsed = createEditorSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const invite = await inviteOrReuseUser(parsed.data.email, parsed.data.fullName, "editor");
  if (!invite.ok) return { ok: false, error: invite.error };

  revalidatePath("/admin/equipo");
  return { ok: true, profileId: invite.profileId, alreadyExisted: invite.alreadyExisted };
}

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
