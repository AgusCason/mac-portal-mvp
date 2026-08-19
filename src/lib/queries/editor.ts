import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface EditorAssignedClient {
  client_id: string;
  name: string;
  can_view_chat: boolean;
  can_view_drive: boolean;
}

/** Clientes asignados a un editor, con sus permisos granulares. */
export async function getEditorAssignedClients(
  editorId: string
): Promise<EditorAssignedClient[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("editor_client_assignments")
    .select("client_id, can_view_chat, can_view_drive, clients(name)")
    .eq("editor_id", editorId);

  return (data ?? []).map((row) => ({
    client_id: row.client_id,
    name: ((row.clients as unknown as { name: string } | null)?.name) ?? "—",
    can_view_chat: row.can_view_chat,
    can_view_drive: row.can_view_drive,
  }));
}
