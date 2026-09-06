"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { inviteOrReuseUser, createUserWithPassword } from "@/lib/onboarding";

const createEditorSchema = z.object({
  fullName: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  // "direct": crea la cuenta ya confirmada con contraseña temporal, sin
  // depender de que llegue ningún email. "invite": el flujo original.
  mode: z.enum(["direct", "invite"]).default("direct"),
});

export type CreateEditorResult =
  | { ok: true; profileId: string; alreadyExisted: boolean; temporaryPassword?: string }
  | { ok: false; error: string };

/**
 * Alta de Editor (Admin). Dos modos (ver `NewEditorDialog`):
 *  - "direct" (default): `createUserWithPassword` — cuenta lista al toque
 *    con una contraseña temporal que el admin le pasa al editor a mano.
 *  - "invite": `inviteOrReuseUser` — el flujo original por email.
 * Cualquiera de los dos dispara el mismo trigger `handle_new_user`, que crea
 * su `profiles`. Deja el perfil listo para asignar a clientes desde
 * `assignEditorToClientAction` (el editor NO ve nada hasta que se le asigne
 * al menos un cliente).
 */
export async function createEditorAction(formData: FormData): Promise<CreateEditorResult> {
  await requireAdmin();

  const parsed = createEditorSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    mode: formData.get("mode"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const result =
    parsed.data.mode === "direct"
      ? await createUserWithPassword(parsed.data.email, parsed.data.fullName, "editor")
      : await inviteOrReuseUser(parsed.data.email, parsed.data.fullName, "editor");
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/admin/equipo");
  return {
    ok: true,
    profileId: result.profileId,
    alreadyExisted: result.alreadyExisted,
    temporaryPassword: result.temporaryPassword,
  };
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
