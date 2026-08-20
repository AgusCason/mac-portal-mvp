"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

/** Vincula un usuario con rol "client" (ya invitado) al portal de un cliente. */
export async function linkClientMemberAction(clientId: string, profileId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("client_members")
    .insert({ client_id: clientId, profile_id: profileId });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/clientes/${clientId}`);
  return { ok: true };
}
