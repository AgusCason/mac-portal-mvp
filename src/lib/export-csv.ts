"use client";

/**
 * Export genérico de listados a .csv (Configuración > Auditoría, Clientes,
 * Contactos, CRM, Facturas, Contratos, Bóveda, Analytics > Explorer). CSV
 * puro en vez de sumar una librería de .xlsx nueva — Excel lo abre igual de
 * bien sin instalar nada, y es texto plano (más fácil de revisar/versionar
 * si alguien lo guarda). RFC 4180: separador coma, celdas con coma/comilla/
 * salto de línea van entre comillas dobles (comillas internas duplicadas).
 */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCsvCell(raw: string | number | null | undefined): string {
  const str = raw === null || raw === undefined ? "" : String(raw);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * Arma el CSV y dispara la descarga en el navegador. El BOM UTF-8 al
 * principio del archivo es a propósito: sin él, Excel en Windows (el caso
 * más común acá) asume Latin-1 y muestra tildes/ñ rotas.
 */
export function downloadCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => escapeCsvCell(c.value(row))).join(","));
  const csv = [header, ...body].join("\r\n");

  const bom = String.fromCharCode(0xfeff);
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
