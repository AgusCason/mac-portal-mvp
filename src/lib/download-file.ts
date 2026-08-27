"use client";

/**
 * Decodifica un PDF (u otro binario) en base64 devuelto por un Server Action
 * y dispara la descarga en el browser — sin necesitar un bucket de Storage
 * ni una signed URL, porque el contenido se genera al vuelo (ver
 * `getInvoicePdfAction`). Vive fuera de cada componente para no duplicar
 * este mismo bloque en la lista del admin y la del cliente.
 */
export function downloadBase64File(base64: string, filename: string, mimeType: string) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
