"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createClientDriveStructure } from "@/lib/google-drive";
import type { DriveFolderType } from "@/types/database";

const createClientSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  brandName: z.string().optional(),
  contactEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  planId: z.string().uuid().optional().or(z.literal("")),
});

export type CreateClientResult =
  | { ok: true; clientId: string }
  | { ok: false; error: string };

/**
 * Alta de cliente (Admin): crea la fila en `clients`, la estructura de
 * carpetas en Google Drive (Crudos / En Edición / Entregables Finales) y,
 * si se indicó, el plan comercial asignado. Todo dentro de un mismo flujo
 * para que el cliente quede 100% operativo desde el primer momento.
 */
export async function createClientAction(
  formData: FormData
): Promise<CreateClientResult> {
  const admin = await requireAdmin();

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    brandName: formData.get("brandName") ?? undefined,
    contactEmail: formData.get("contactEmail") ?? "",
    contactPhone: formData.get("contactPhone") ?? undefined,
    planId: formData.get("planId") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { name, brandName, contactEmail, contactPhone, planId } = parsed.data;
  const supabase = await createSupabaseServerClient();

  // 1. Fila del cliente
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name,
      brand_name: brandName || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (clientError || !client) {
    return { ok: false, error: clientError?.message ?? "No se pudo crear el cliente" };
  }

  // 2. Estructura de carpetas en Google Drive (si las credenciales están configuradas)
  try {
    const { clientFolderId, subfolders } = await createClientDriveStructure(name);

    await supabase
      .from("clients")
      .update({ drive_root_folder_id: clientFolderId })
      .eq("id", client.id);

    const folderRows = (Object.entries(subfolders) as [DriveFolderType, string][]).map(
      ([folder_type, drive_folder_id]) => ({
        client_id: client.id,
        folder_type,
        drive_folder_id,
      })
    );
    await supabase.from("drive_folders").insert(folderRows);
  } catch (driveError) {
    // No abortamos el alta del cliente si Drive falla (ej: credenciales no
    // configuradas todavía en desarrollo) — se puede reintentar después.
    console.error("[createClientAction] Google Drive:", driveError);
  }

  // 3. Plan comercial (opcional)
  if (planId) {
    await supabase.from("client_plans").insert({
      client_id: client.id,
      plan_id: planId,
    });
  }

  revalidatePath("/admin/clientes");
  return { ok: true, clientId: client.id };
}

/** Cambia el estado comercial de un cliente (activo/pausado/perdido). Solo admin. */
export async function updateClientStatusAction(
  clientId: string,
  status: "active" | "paused" | "churned"
) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ status })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/clientes");
  return { ok: true };
}
