import "server-only";
import { google } from "googleapis";
import type { DriveFolderType } from "@/types/database";

/**
 * Cliente de Google Drive autenticado con una Service Account.
 * Setup (ver README.md § Google Drive):
 *  1. Crear un proyecto en Google Cloud Console y habilitar "Google Drive API".
 *  2. Crear una Service Account, generar una key JSON.
 *  3. Compartir la carpeta raíz de Drive de la agencia con el email
 *     de la service account (client_email) dándole rol "Editor".
 *  4. Copiar client_email y private_key a .env.local (ver .env.example).
 */
function getDriveClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Faltan credenciales de Google Drive (GOOGLE_SERVICE_ACCOUNT_EMAIL / " +
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY). Ver .env.example."
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

const FOLDER_LABELS: Record<DriveFolderType, string> = {
  crudos: "Crudos",
  en_edicion: "En Edición",
  entregables_finales: "Entregables Finales",
};

async function createFolder(name: string, parentId: string) {
  const drive = getDriveClient();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
    supportsAllDrives: true,
  });
  if (!res.data.id) throw new Error(`No se pudo crear la carpeta "${name}"`);
  return res.data.id;
}

/**
 * Crea la estructura estándar de un cliente nuevo dentro de la carpeta raíz
 * de la agencia: <root>/<Nombre Cliente>/{Crudos, En Edición, Entregables Finales}
 * Devuelve el id de la carpeta del cliente y el id de cada subcarpeta.
 */
export async function createClientDriveStructure(clientName: string): Promise<{
  clientFolderId: string;
  subfolders: Record<DriveFolderType, string>;
}> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error(
      "Falta GOOGLE_DRIVE_ROOT_FOLDER_ID (id de la carpeta raíz de la agencia en Drive)."
    );
  }

  const clientFolderId = await createFolder(clientName, rootFolderId);

  const entries = await Promise.all(
    (Object.keys(FOLDER_LABELS) as DriveFolderType[]).map(async (type) => {
      const id = await createFolder(FOLDER_LABELS[type], clientFolderId);
      return [type, id] as const;
    })
  );

  const subfolders = Object.fromEntries(entries) as Record<
    DriveFolderType,
    string
  >;

  return { clientFolderId, subfolders };
}

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string | null;
  webViewLink?: string | null;
  createdTime?: string | null;
  size?: string | null;
}

/** Lista los archivos dentro de una carpeta de Drive (para el previsualizador). */
export async function listDriveFiles(
  folderId: string
): Promise<DriveFileSummary[]> {
  const drive = getDriveClient();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields:
      "files(id, name, mimeType, thumbnailLink, webViewLink, createdTime, size)",
    orderBy: "createdTime desc",
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return (res.data.files ?? []) as DriveFileSummary[];
}

/** Genera una URL de subida reanudable (resumable) para subir un archivo grande con progreso. */
export async function createResumableUploadSession(
  folderId: string,
  fileName: string,
  mimeType: string
) {
  const drive = getDriveClient();
  const res = await drive.files.create(
    {
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType },
      fields: "id",
      uploadType: "resumable",
    },
    { params: { uploadType: "resumable" } }
  );
  return res.data.id;
}

/** Borra (mueve a la papelera) un archivo de Drive. */
export async function trashDriveFile(fileId: string) {
  const drive = getDriveClient();
  await drive.files.update({ fileId, requestBody: { trashed: true } });
}
