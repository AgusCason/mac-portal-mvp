import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CrmLead } from "@/types/database";

/** Pipeline completo de prospectos (RLS ya restringe esto a admin). */
export async function getCrmLeads(): Promise<CrmLead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getCrmLeads]", error.message);
    return [];
  }
  return data ?? [];
}
