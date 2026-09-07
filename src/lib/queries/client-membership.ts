import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ClientStatus } from "@/types/database";

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

/**
 * Status comercial (activo/pausado/perdido) del cliente al que pertenece
 * `clientId` — usado por `/client/layout.tsx` para bloquear el portal
 * cuando el admin marcó al cliente como Pausado o Perdido (ver
 * ClientStatusMenu en la ficha admin). No se puede leer con un `select`
 * normal a `clients`: una vez pausado/perdido, `client_has_access()` (que
 * gatea esa tabla vía RLS) deja de dar acceso — por eso pasa por el RPC
 * `my_client_status`, la única excepción que le permite a un cliente
 * bloqueado leer justamente ESE dato para poder explicarle qué pasó (ver
 * 0044_block_inactive_client_access.sql). Devuelve `null` si el `clientId`
 * no le pertenece al usuario logueado.
 */
export async function getClientStatus(clientId: string): Promise<ClientStatus | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_client_status", { p_client_id: clientId });
  if (error) {
    console.error("[getClientStatus]", error.message);
    return null;
  }
  return data ?? null;
}
