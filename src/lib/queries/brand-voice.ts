import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ClientBrandVoice } from "@/types/database";

/** Social Media > Brand Voice — ficha de tono de marca de una cuenta puntual. */
export async function getClientBrandVoice(clientId: string): Promise<ClientBrandVoice | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_brand_voice")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) {
    console.error("[getClientBrandVoice]", error.message);
    return null;
  }
  return data;
}
