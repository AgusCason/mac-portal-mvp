"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

function triggerCsvDownload(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Botón "Exportar CSV" reusable — Clientes, Contactos, CRM, Facturas,
 * Contratos, Bóveda (solo metadata, nunca el secreto), Auditoría y
 * Analytics > Explorer. Recibe el CSV YA ARMADO (`buildCsv` en
 * `@/lib/export-csv`, corrido en el server component que lo usa) — nunca
 * columnas con funciones ni filas crudas: eso cruzaría un valor no
 * serializable de Server a Client Component y rompe el render (ver el
 * comment grande en export-csv.ts).
 */
export function ExportCsvButton({
  filename,
  csv,
  disabled,
  className,
}: {
  filename: string;
  csv: string;
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className ?? "h-8"}
      disabled={disabled}
      onClick={() => triggerCsvDownload(filename, csv)}
    >
      <Download className="size-3.5" />
      {t("components.shared.exportCsv", "Exportar CSV")}
    </Button>
  );
}
