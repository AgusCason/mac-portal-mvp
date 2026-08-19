import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/types/database";

/** Lista de clientes visible para el usuario actual (RLS-aware). */
export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getClients]", error.message);
    return [];
  }
  return data ?? [];
}

export interface ClientDetail {
  client: Client;
  planName: string | null;
  driveFolders: { folder_type: string; drive_folder_id: string }[];
  assignments: {
    id: string;
    editor_id: string;
    editor_name: string;
    can_view_chat: boolean;
    can_view_drive: boolean;
  }[];
  contentCount: number;
  contractCount: number;
}

/** Ficha completa de un cliente para /admin/clientes/[id]. */
export async function getClientDetail(clientId: string): Promise<ClientDetail | null> {
  const supabase = await createClient();

  const [{ data: client }, { data: planRow }, { data: driveFolders }, { data: assignments }, { count: contentCount }, { count: contractCount }] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase
        .from("client_plans")
        .select("plans(name)")
        .eq("client_id", clientId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle(),
      supabase.from("drive_folders").select("folder_type, drive_folder_id").eq("client_id", clientId),
      supabase
        .from("editor_client_assignments")
        .select("id, editor_id, can_view_chat, can_view_drive, profiles(full_name, email)")
        .eq("client_id", clientId),
      supabase
        .from("content_items")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId),
      supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId),
    ]);

  if (!client) return null;

  return {
    client,
    planName: (planRow?.plans as unknown as { name: string } | null)?.name ?? null,
    driveFolders: driveFolders ?? [],
    assignments: (assignments ?? []).map((a) => {
      const p = a.profiles as unknown as { full_name: string; email: string } | null;
      return {
        id: a.id,
        editor_id: a.editor_id,
        editor_name: p?.full_name || p?.email || "—",
        can_view_chat: a.can_view_chat,
        can_view_drive: a.can_view_drive,
      };
    }),
    contentCount: contentCount ?? 0,
    contractCount: contractCount ?? 0,
  };
}
