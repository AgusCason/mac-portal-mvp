import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/** Usuarios con rol "client" que todavía no están vinculados a este cliente. */
export async function getUnlinkedClientProfiles(clientId: string): Promise<Profile[]> {
  const supabase = await createClient();
  const [{ data: allClientProfiles }, { data: linked }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "client"),
    supabase.from("client_members").select("profile_id").eq("client_id", clientId),
  ]);

  const linkedIds = new Set((linked ?? []).map((l) => l.profile_id));
  return (allClientProfiles ?? []).filter((p) => !linkedIds.has(p.id));
}
