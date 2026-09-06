"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase/server";

const MEDIA_PATH = "/admin/media-library";
const MEDIA_BUCKET = "media-library";
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

/**
 * `file.name` viene tal cual lo puso el usuario en su sistema operativo —
 * antes se usaba directo dentro del storage path (`${folderId}/${Date.now()}-
 * ${file.name}`). Acepta admin únicamente hoy (`requireAdmin()` arriba en
 * `uploadMediaAssetAction`), pero un nombre de archivo con `/`, `..` u otros
 * caracteres raros ahí adentro sigue siendo una entrada no confiable que no
 * hace falta aceptar tal cual — esto lo deja seguro sin cambiar la
 * extensión ni el nombre visible (`file_name` en la fila de `media_assets`
 * conserva el original para mostrar en la UI).
 */
function sanitizeStorageFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() || "archivo";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180) || "archivo";
}

const folderSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  color: z.string().min(1).default("gray"),
});

/** Crea una carpeta nueva. */
export async function createMediaFolderAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = folderSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") || "gray",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("media_folders").insert({
    name: parsed.data.name,
    color: parsed.data.color,
    created_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(MEDIA_PATH);
  return { ok: true };
}

/** Elimina una carpeta (los archivos quedan sin carpeta, no se borran). */
export async function deleteMediaFolderAction(folderId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("media_folders").delete().eq("id", folderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(MEDIA_PATH);
  return { ok: true };
}

/**
 * Sube un archivo real al bucket privado `media-library` (Service Role Key,
 * igual que el flujo de `reports`) y guarda la fila en `media_assets`.
 */
export async function uploadMediaAssetAction(formData: FormData) {
  const admin = await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Seleccioná un archivo." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "El archivo supera el límite de 25MB." };
  }

  const rawFolderId = (formData.get("folderId") as string) || "";
  const rawClientId = (formData.get("clientId") as string) || "";
  const folderId = rawFolderId === "none" ? "" : rawFolderId;
  const clientId = rawClientId === "none" ? "" : rawClientId;

  const supabase = await createSupabaseServerClient();
  const serviceRole = createServiceRoleClient();

  const storagePath = `${folderId || "sin-carpeta"}/${Date.now()}-${sanitizeStorageFilename(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await serviceRole.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) return { ok: false, error: `No se pudo subir el archivo: ${uploadError.message}` };

  const { error: insertError } = await supabase.from("media_assets").insert({
    folder_id: folderId || null,
    client_id: clientId || null,
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    uploaded_by: admin.id,
  });

  if (insertError) return { ok: false, error: insertError.message };
  revalidatePath(MEDIA_PATH);
  return { ok: true };
}

/** Elimina un archivo (fila + objeto en storage). */
export async function deleteMediaAssetAction(assetId: string, storagePath: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const serviceRole = createServiceRoleClient();

  await serviceRole.storage.from(MEDIA_BUCKET).remove([storagePath]);
  const { error } = await supabase.from("media_assets").delete().eq("id", assetId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(MEDIA_PATH);
  return { ok: true };
}

/** Signed URL de corta duración para ver/descargar un archivo. */
export async function getMediaAssetUrlAction(
  storagePath: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  const serviceRole = createServiceRoleClient();
  const { data, error } = await serviceRole.storage.from(MEDIA_BUCKET).createSignedUrl(storagePath, 60);
  if (error || !data?.signedUrl) return { ok: false, error: "No se pudo generar el link." };
  return { ok: true, url: data.signedUrl };
}
