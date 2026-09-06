"use client";

import { Wallet } from "lucide-react";
import type { EditorClientRate } from "@/lib/queries/editor-finance";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

const FREQUENCY_LABEL_KEYS: Record<string, [string, string]> = {
  mensual: ["components.finance.frequencyMonthly", "Mensual"],
  quincenal: ["components.finance.frequencyBiweekly", "Quincenal"],
  unico: ["components.finance.frequencyOnce", "Pago único"],
  por_entrega: ["components.finance.frequencyPerDelivery", "Por entrega"],
};

/** Tarifas por cliente del propio editor (/editor/finanzas) — solo lectura. */
export function MyRatesList({ rates }: { rates: EditorClientRate[] }) {
  const { t } = useLocale();

  function frequencyLabel(freq: string | null) {
    if (!freq) return "—";
    const entry = FREQUENCY_LABEL_KEYS[freq];
    return entry ? t(entry[0], entry[1]) : freq;
  }

  if (rates.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title={t("pages.editorFinanzas.noClients", "Todavía no tenés clientes asignados.")}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("components.finance.colClient", "Cliente")}</TableHead>
            <TableHead>{t("components.finance.colAmount", "Monto")}</TableHead>
            <TableHead>{t("components.finance.colFrequency", "Frecuencia")}</TableHead>
            <TableHead>{t("components.finance.colPayDay", "Día de pago")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.map((r) => (
            <TableRow key={r.assignmentId}>
              <TableCell className="font-medium">{r.clientName}</TableCell>
              <TableCell className={cn("tabular-nums", r.amount == null && "text-muted-foreground")}>
                {r.amount != null
                  ? formatCurrency(r.amount, r.currency)
                  : t("components.finance.noAmount", "Sin definir")}
              </TableCell>
              <TableCell className="text-muted-foreground">{frequencyLabel(r.frequency)}</TableCell>
              <TableCell className="text-muted-foreground">{r.paymentDay ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
