/**
 * Sube un archivo directo al navegador → Google Drive usando la URL de una
 * sesión resumable (ver `createResumableUploadSession` en `lib/google-drive.ts`
 * y la Server Action `createUploadSessionAction`). Usamos XHR en vez de
 * `fetch` porque es la única API del browser que expone progreso real de
 * subida (`upload.onprogress`), necesario para archivos de video pesados.
 */
export function uploadToDriveSession(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ id: string; name: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Google Drive respondió con error ${xhr.status}.`));
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText) as { id: string; name: string };
        resolve(data);
      } catch {
        reject(new Error("Respuesta inesperada de Google Drive."));
      }
    };

    xhr.onerror = () => reject(new Error("Error de red subiendo el archivo."));
    xhr.send(file);
  });
}
