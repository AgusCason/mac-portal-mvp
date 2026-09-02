"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv, type CsvColumn } from "@/lib/export-csv";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Botón "Exportar CSV" reusable — Clientes, Contactos, CRM, Facturas,
 * Contratos, Bóveda (solo metadata, nunca el secreto), Auditoría y
 * Analytics > Explorer. Recibe las filas YA resueltas/filtradas por quien lo
 * usa (server component, o el propio filtrado client-side de Clientes) — así
 * el CSV siempre coincide con lo que se está mirando en pantalla.
 */
export function ExportCsvButton<T>({
  filename,
  columns,
  rows,
  className,
}: {
  filename: string;
  columns: CsvColumn<T>[];
  rows: T[];
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className ?? "h-8"}
      disabled={rows.length === 0}
      onClick={() => downloadCsv(filename, columns, rows)}
    >
      <Download className="size-3.5" />
      {t("components.shared.exportCsv", "Exportar CSV")}
    </Button>
  );
}
