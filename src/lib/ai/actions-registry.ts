import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createClientDriveStructure } from "@/lib/google-drive";
import type { DriveFolderType } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

/**
 * Catálogo CERRADO de mutaciones que el asistente puede proponer. Esto es
 * lo único que puede terminar escribiendo en la base: no hay "ejecutar SQL
 * libre" en ningún lado. Cada acción:
 *   1) valida su payload con zod,
 *   2) sabe mostrar un preview (antes/después) para la tarjeta de confirmación,
 *   3) solo se ejecuta cuando el admin hace clic en "Confirmar" en la UI
 *      (nunca automáticamente, ni siquiera si Claude está "seguro").
 */

const ACTION_SCHEMAS = {
  fix_missing_drive_folders: z.object({}),
  update_client_status: z.object({
    status: z.enum(["active", "paused", "churned"]),
  }),
  update_client_contact: z.object({
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
  }),
  update_editor_permissions: z.object({
    canViewChat: z.boolean(),
    canViewDrive: z.boolean(),
  }),
  update_content_status: z.object({
    status: z.enum([
      "borrador",
      "en_edicion",
      "por_aprobar",
      "requiere_cambios",
      "aprobado",
      "programado",
      "publicado",
    ]),
  }),
} as const;

export type ActionType = keyof typeof ACTION_SCHEMAS;

export const ACTION_TYPES = Object.keys(ACTION_SCHEMAS) as ActionType[];

export function isKnownActionType(value: string): value is ActionType {
  return value in ACTION_SCHEMAS;
}

export interface ActionPreview {
  label: string;
  targetTable: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

/** Trae el estado actual del registro objetivo, para mostrar un diff real en la UI. */
export async function previewAction(
  actionType: ActionType,
  targetId: string,
  payload: unknown,
  supabase: AdminClient
): Promise<ActionPreview | { error: string }> {
  const schema = ACTION_SCHEMAS[actionType];
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Payload inválido" };

  switch (actionType) {
    case "fix_missing_drive_folders": {
      const { data } = await supabase.from("clients").select("name").eq("id", targetId).single();
      return {
        label: `Crear carpetas de Drive faltantes${data ? ` para "${data.name}"` : ""}`,
        targetTable: "drive_folders",
        before: { drive_folders: "ninguna" },
        after: { drive_folders: "Crudos, En Edición, Entregables Finales" },
      };
    }
    case "update_client_status": {
      const { data } = await supabase
        .from("clients")
        .select("name, status")
        .eq("id", targetId)
        .single();
      return {
        label: `Cambiar estado de cliente${data ? ` "${data.name}"` : ""}`,
        targetTable: "clients",
        before: { status: data?.status ?? "—" },
        after: parsed.data,
      };
    }
    case "update_client_contact": {
      const { data } = await supabase
        .from("clients")
        .select("name, contact_email, contact_phone")
        .eq("id", targetId)
        .single();
      return {
        label: `Actualizar contacto de cliente${data ? ` "${data.name}"` : ""}`,
        targetTable: "clients",
        before: { contact_email: data?.contact_email, contact_phone: data?.contact_phone },
        after: parsed.data,
      };
    }
    case "update_editor_permissions": {
      const { data } = await supabase
        .from("editor_client_assignments")
        .select("can_view_chat, can_view_drive, clients(name), profiles(full_name)")
        .eq("id", targetId)
        .single();
      const clientName = (data?.clients as unknown as { name: string } | null)?.name;
      const editorName = (data?.profiles as unknown as { full_name: string } | null)?.full_name;
      return {
        label: `Actualizar permisos de ${editorName ?? "editor"}${clientName ? ` en "${clientName}"` : ""}`,
        targetTable: "editor_client_assignments",
        before: { can_view_chat: data?.can_view_chat, can_view_drive: data?.can_view_drive },
        after: parsed.data,
      };
    }
    case "update_content_status": {
      const { data } = await supabase
        .from("content_items")
        .select("title, status")
        .eq("id", targetId)
        .single();
      return {
        label: `Cambiar estado de contenido${data ? ` "${data.title}"` : ""}`,
        targetTable: "content_items",
        before: { status: data?.status ?? "—" },
        after: parsed.data,
      };
    }
  }
}

/** Ejecuta la mutación real. Solo se llama desde confirmAiActionAction, tras confirmación humana. */
export async function executeAction(
  actionType: ActionType,
  targetId: string,
  payload: unknown,
  supabase: AdminClient
): Promise<{ ok: true; summary: string } | { ok: false; error: string }> {
  const schema = ACTION_SCHEMAS[actionType];
  const parsedGeneric = schema.safeParse(payload);
  if (!parsedGeneric.success) {
    return { ok: false, error: parsedGeneric.error.issues[0]?.message ?? "Payload inválido" };
  }

  switch (actionType) {
    case "fix_missing_drive_folders": {
      const { data: client } = await supabase
        .from("clients")
        .select("name")
        .eq("id", targetId)
        .single();
      if (!client) return { ok: false, error: "Cliente no encontrado." };

      try {
        const { clientFolderId, subfolders } = await createClientDriveStructure(client.name);
        await supabase
          .from("clients")
          .update({ drive_root_folder_id: clientFolderId })
          .eq("id", targetId);
        const rows = (Object.entries(subfolders) as [DriveFolderType, string][]).map(
          ([folder_type, drive_folder_id]) => ({
            client_id: targetId,
            folder_type,
            drive_folder_id,
          })
        );
        const { error } = await supabase.from("drive_folders").insert(rows);
        if (error) return { ok: false, error: error.message };
        return { ok: true, summary: `Carpetas de Drive creadas para "${client.name}".` };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Error desconocido creando carpetas de Drive.",
        };
      }
    }

    case "update_client_status": {
      const data = parsedGeneric.data as z.infer<typeof ACTION_SCHEMAS.update_client_status>;
      const { error } = await supabase
        .from("clients")
        .update({ status: data.status })
        .eq("id", targetId);
      if (error) return { ok: false, error: error.message };
      return { ok: true, summary: `Estado del cliente actualizado a "${data.status}".` };
    }

    case "update_client_contact": {
      const data = parsedGeneric.data as z.infer<typeof ACTION_SCHEMAS.update_client_contact>;
      const { error } = await supabase
        .from("clients")
        .update({
          contact_email: data.contactEmail,
          contact_phone: data.contactPhone,
        })
        .eq("id", targetId);
      if (error) return { ok: false, error: error.message };
      return { ok: true, summary: "Datos de contacto del cliente actualizados." };
    }

    case "update_editor_permissions": {
      const data = parsedGeneric.data as z.infer<typeof ACTION_SCHEMAS.update_editor_permissions>;
      const { error } = await supabase
        .from("editor_client_assignments")
        .update({
          can_view_chat: data.canViewChat,
          can_view_drive: data.canViewDrive,
        })
        .eq("id", targetId);
      if (error) return { ok: false, error: error.message };
      return { ok: true, summary: "Permisos del editor actualizados." };
    }

    case "update_content_status": {
      const data = parsedGeneric.data as z.infer<typeof ACTION_SCHEMAS.update_content_status>;
      const { error } = await supabase
        .from("content_items")
        .update({ status: data.status })
        .eq("id", targetId);
      if (error) return { ok: false, error: error.message };
      return { ok: true, summary: `Estado de la pieza actualizado a "${data.status}".` };
    }
  }
}
