/**
 * Export genérico de listados a .csv (Configuración > Auditoría, Clientes,
 * Contactos, CRM, Facturas, Contratos, Bóveda, Analytics > Explorer). CSV
 * puro en vez de sumar una librería de .xlsx nueva — Excel lo abre igual de
 * bien sin instalar nada, y es texto plano (más fácil de revisar/versionar
 * si alguien lo guarda). RFC 4180: separador coma, celdas con coma/comilla/
 * salto de línea van entre comillas dobles (comillas internas duplicadas).
 *
 * SIN "use client": lo llaman tanto Server Components (páginas admin, que
 * arman el CSV en el server con `buildCsv` y solo mandan el string ya
 * armado al cliente) como el propio `ExportCsvButton` ("use client"). Antes
 * este módulo estaba marcado "use client" y las páginas pasaban `columns`
 * (con funciones `value`) + `rows` como props a `ExportCsvButton` — pasar
 * funciones de un Server Component a un Client Component rompe el render en
 * el server (no son serializables), que es exactamente lo que tiraba
 * "This page couldn't load" en Contactos/Contratos/CRM/Bóveda/Auditoría/
 * Explorer/Planes. Ahora el CSV (un string) se arma ACÁ, en el server,
 * antes de cruzar al cliente.
 */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCsvCell(raw: string | number | null | undefined): string {
  const str = raw === null || raw === undefined ? "" : String(raw);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** Arma el CSV (string, con BOM) a partir de columnas + filas. */
export function buildCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => escapeCsvCell(c.value(row))).join(","));
  // El BOM UTF-8 al principio es a propósito: sin él, Excel en Windows (el
  // caso más común acá) asume Latin-1 y muestra tildes/ñ rotas.
  const bom = String.fromCharCode(0xfeff);
  return bom + [header, ...body].join("\r\n");
}
