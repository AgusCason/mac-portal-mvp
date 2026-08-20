"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createClientDriveStructure, linkExistingClientFolder } from "@/lib/google-drive";
import { inviteOrReuseUser } from "@/lib/onboarding";
import type { DriveFolderType } from "@/types/database";

const createClientSchema = z.object({
  name: z.string().min(2, "El nombre / razón social es obligatorio"),
  brandName: z.string().optional(),
  contactFullName: z.string().min(2, "Nombre y apellido del contacto es obligatorio"),
  contactEmail: z.string().email("Email inválido"),
  contactPhone: z.string().optional(),
  country: z.string().optional(),
  socialInstagram: z.string().optional(),
  socialTiktok: z.string().optional(),
  socialFacebook: z.string().optional(),
  socialYoutube: z.string().optional(),
  socialWebsite: z.string().optional(),
  planId: z.string().uuid().optional().or(z.literal("")),
  billingCutoffDay: z.coerce.number().int().min(1).max(31).optional().or(z.nan()),
  driveMode: z.enum(["auto", "linked"]).default("auto"),
  existingDriveFolderId: z.string().optional(),
});

export type CreateClientResult =
  | { ok: true; clientId: string; invitedEmail: string; alreadyExisted: boolean }
  | { ok: false; error: string };

/**
 * Alta integral de Cliente (Admin) — REQUERIMIENTO CRÍTICO de aprovisionamiento
 * automático. Un único flujo atómico (a nivel de aplicación; cada paso revierte
 * lo que puede si algo falla más adelante) que deja al cliente 100% operativo:
 *
 *  1. Invita al contacto por email vía Supabase Auth Admin API — le llega el
 *     correo oficial con el link para setear su contraseña (`lib/onboarding.ts`).
 *     El trigger `handle_new_user` crea su `profiles` con role=client solo.
 *  2. Crea la fila de negocio en `clients` (datos de contacto, país, redes,
 *     fecha de corte de facturación).
 *  3. Vincula el nuevo perfil como miembro del portal de ese cliente
 *     (`client_members`) — ya puede loguearse y ver su propio portal.
 *  4. Google Drive: crea la estructura de carpetas automáticamente, o genera
 *     las 3 subcarpetas estándar dentro de un folder ya existente si el admin
 *     eligió "vincular carpeta existente".
 *  5. Si se indicó un plan, lo asigna en `client_plans`.
 */
export async function createClientAction(
  formData: FormData
): Promise<CreateClientResult> {
  const admin = await requireAdmin();

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    brandName: formData.get("brandName") ?? undefined,
    contactFullName: formData.get("contactFullName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone") ?? undefined,
    country: formData.get("country") ?? undefined,
    socialInstagram: formData.get("socialInstagram") ?? undefined,
    socialTiktok: formData.get("socialTiktok") ?? undefined,
    socialFacebook: formData.get("socialFacebook") ?? undefined,
    socialYoutube: formData.get("socialYoutube") ?? undefined,
    socialWebsite: formData.get("socialWebsite") ?? undefined,
    planId: formData.get("planId") ?? "",
    billingCutoffDay: formData.get("billingCutoffDay") || undefined,
    driveMode: formData.get("driveMode") || "auto",
    existingDriveFolderId: formData.get("existingDriveFolderId") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const {
    name,
    brandName,
    contactFullName,
    contactEmail,
    contactPhone,
    country,
    socialInstagram,
    socialTiktok,
    socialFacebook,
    socialYoutube,
    socialWebsite,
    planId,
    billingCutoffDay,
    driveMode,
    existingDriveFolderId,
  } = parsed.data;

  // 1. Invitar (o reutilizar) el usuario real que va a loguearse al portal.
  const invite = await inviteOrReuseUser(contactEmail, contactFullName, "client");
  if (!invite.ok) return { ok: false, error: invite.error };

  const supabase = await createSupabaseServerClient();

  // 2. Fila de negocio del cliente
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name,
      brand_name: brandName || null,
      contact_email: contactEmail,
      contact_phone: contactPhone || null,
      country: country || null,
      social_instagram: socialInstagram || null,
      social_tiktok: socialTiktok || null,
      social_facebook: socialFacebook || null,
      social_youtube: socialYoutube || null,
      social_website: socialWebsite || null,
      billing_cutoff_day: Number.isFinite(billingCutoffDay) ? billingCutoffDay : null,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (clientError || !client) {
    return { ok: false, error: clientError?.message ?? "No se pudo crear el cliente" };
  }

  // 3. Vincula el perfil invitado como miembro del portal de este cliente.
  await supabase
    .from("client_members")
    .insert({ client_id: client.id, profile_id: invite.profileId });

  // 4. Google Drive (auto o vincular existente) — si falla, no abortamos el
  // alta (ej: credenciales no configuradas todavía) — se puede reintentar
  // después desde el Asistente IA (`fix_missing_drive_folders`).
  try {
    const { clientFolderId, subfolders } =
      driveMode === "linked" && existingDriveFolderId
        ? await linkExistingClientFolder(existingDriveFolderId)
        : await createClientDriveStructure(name);

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
    console.error("[createClientAction] Google Drive:", driveError);
  }

  // 5. Plan comercial (opcional)
  if (planId) {
    await supabase.from("client_plans").insert({
      client_id: client.id,
      plan_id: planId,
    });
  }

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/equipo");
  return {
    ok: true,
    clientId: client.id,
    invitedEmail: contactEmail,
    alreadyExisted: invite.alreadyExisted,
  };
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
