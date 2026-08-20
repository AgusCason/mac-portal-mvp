"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { requireAdmin, requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const createContractSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(2),
  fileUrl: z.string().url("Tiene que ser una URL válida (PDF)"),
});

/** Sube un nuevo contrato/documento legal para un cliente. Solo admin. */
export async function createContractAction(formData: FormData) {
  await requireAdmin();
  const parsed = createContractSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    fileUrl: formData.get("fileUrl"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contracts").insert({
    client_id: parsed.data.clientId,
    title: parsed.data.title,
    file_url: parsed.data.fileUrl,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/contratos");
  return { ok: true };
}

/**
 * El cliente firma un contrato propio (vía RPC `sign_contract`, security definer).
 * Registra la IP de origen (`signed_ip`) a partir de los headers del request
 * para dejar rastro legal/auditable de la aceptación de términos.
 */
export async function signContractAction(contractId: string) {
  await requireRole(["client"]);
  const supabase = await createSupabaseServerClient();
  const headerList = await headers();
  const clientIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    null;

  const { error } = await supabase.rpc("sign_contract", {
    target_contract_id: contractId,
    client_ip: clientIp,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/client/contratos");
  revalidatePath("/admin/contratos");
  return { ok: true };
}
