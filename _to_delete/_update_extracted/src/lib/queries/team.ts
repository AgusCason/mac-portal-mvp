import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/** Todos los editores de la agencia (para /admin/equipo). */
export async function getEditors(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "editor")
    .order("full_name");
  if (error) {
    console.error("[getEditors]", error.message);
    return [];
  }
  return data ?? [];
}
