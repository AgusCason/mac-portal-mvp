import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { VaultCredential } from "@/types/database";

export interface VaultCredentialWithClient extends VaultCredential {
  client_name: string | null;
}

/**
 * Listado de la bóveda — nunca trae `secret_encrypted`: ni cifrado se expone
 * a la UI de listado, el valor real solo sale bajo demanda vía
 * `revealVaultCredentialAction` (que exige la passphrase del server).
 */
export async function getVaultCredentials(): Promise<VaultCredentialWithClient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vault_credentials")
    .select("id, client_id, label, username, url, notes, created_by, created_at, updated_at, clients(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getVaultCredentials]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const client = row.clients as unknown as { name: string } | null;
    return {
      id: row.id,
      client_id: row.client_id,
      label: row.label,
      username: row.username,
      url: row.url,
      notes: row.notes,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      client_name: client?.name ?? null,
    };
  });
}
