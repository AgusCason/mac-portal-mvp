import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Devuelve el primer `client_id` al que está vinculado un usuario del rol
 * "client". El schema soporta múltiples usuarios por cliente (client_members)
 * y, en el futuro, un mismo usuario en más de un cliente — para ese caso se
 * puede extender esto a un selector de cuenta en la UI.
 */
export async function getPrimaryClientId(profileId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_members")
    .select("client_id")
    .eq("profile_id", profileId)
    .limit(1)
    .maybeSingle();
  return data?.client_id ?? null;
}
