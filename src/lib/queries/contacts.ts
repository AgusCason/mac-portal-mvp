import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Contact } from "@/types/database";

export interface ContactWithClient extends Contact {
  client_name: string | null;
}

/** Management > Contactos — directorio de personas del workspace. */
export async function getContacts(limit = 500): Promise<ContactWithClient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*, clients(name)")
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[getContacts]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const typed = row as unknown as Contact & { clients: { name: string } | null };
    const { clients, ...rest } = typed;
    return { ...rest, client_name: clients?.name ?? null };
  });
}
