"use server";

import { requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listDriveFiles,
  createResumableUploadSession,
  type DriveFileSummary,
} from "@/lib/google-drive";
import type { DriveFolderType } from "@/types/database";

/**
 * Devuelve los archivos de una subcarpeta de Drive para un cliente dado.
 * La autorización real ocurre en dos capas:
 *  1) RLS en `drive_folders` (el editor necesita can_view_drive=true, el
 *     cliente necesita ser miembro) — si no tiene acceso, el select no
 *     devuelve filas y esta función corta acá.
 *  2) La Service Account de Drive solo puede ver lo que la agencia compartió.
 */
export async function getClientDriveFilesAction(
  clientId: string,
  folderType: DriveFolderType
): Promise<{ ok: true; files: DriveFileSummary[] } | { ok: false; error: string }> {
  await requireRole(["admin", "editor", "client"]);
  const supabase = await createSupabaseServerClient();

  const { data: folder, error } = await supabase
    .from("drive_folders")
    .select("drive_folder_id")
    .eq("client_id", clientId)
    .eq("folder_type", folderType)
    .single();

  if (error || !folder) {
    return { ok: false, error: "No tenés acceso a esta carpeta o todavía no fue creada." };
  }

  try {
    const files = await listDriveFiles(folder.drive_folder_id);
    return { ok: true, files };
  } catch (driveError) {
    console.error("[getClientDriveFilesAction]", driveError);
    return { ok: false, error: "No se pudo conectar con Google Drive." };
  }
}

/**
 * Abre una sesión de subida reanudable hacia una subcarpeta de Drive de un
 * cliente y devuelve la URL de sesión para que el navegador suba el archivo
 * directamente (ver `createResumableUploadSession`). Usado por el editor al
 * entregar un render y por el cliente al subir crudos.
 * Misma doble capa de autorización que `getClientDriveFilesAction`.
 */
export async function createUploadSessionAction(
  clientId: string,
  folderType: DriveFolderType,
  fileName: string,
  mimeType: string
): Promise<{ ok: true; uploadUrl: string } | { ok: false; error: string }> {
  await requireRole(["admin", "editor", "client"]);
  const supabase = await createSupabaseServerClient();

  const { data: folder, error } = await supabase
    .from("drive_folders")
    .select("drive_folder_id")
    .eq("client_id", clientId)
    .eq("folder_type", folderType)
    .single();

  if (error || !folder) {
    return { ok: false, error: "No tenés acceso a esta carpeta o todavía no fue creada." };
  }

  try {
    const uploadUrl = await createResumableUploadSession(
      folder.drive_folder_id,
      fileName,
      mimeType
    );
    return { ok: true, uploadUrl };
  } catch (driveError) {
    console.error("[createUploadSessionAction]", driveError);
    return { ok: false, error: "No se pudo iniciar la subida a Google Drive." };
  }
}
