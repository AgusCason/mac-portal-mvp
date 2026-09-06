"use client";

import { CheckCircle2, History } from "lucide-react";
import type { EditorPayoutWithClient } from "@/lib/queries/editor-finance";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

const PAYOUT_METHOD_KEYS: [string, string, string][] = [
  ["transferencia", "components.finance.methodTransfer", "Transferencia"],
  ["mercadopago", "components.finance.methodMercadopago", "Mercado Pago"],
  ["paypal", "components.finance.methodPaypal", "PayPal"],
  ["payoneer", "components.finance.methodPayoneer", "Payoneer"],
  ["efectivo", "components.finance.methodCash", "Efectivo"],
  ["crypto", "components.finance.methodCrypto", "Cripto"],
  ["otro", "components.finance.methodOther", "Otro"],
];

/**
 * Historial de pagos del propio editor (/editor/finanzas) — 100% de solo
 * lectura, RLS ya lo acota a sus propias filas (ver editor_payouts_editor_select).
 */
export function MyPayoutList({ payouts }: { payouts: EditorPayoutWithClient[] }) {
  const { t } = useLocale();

  function methodLabel(method: string | null) {
    if (!method) return "—";
    const entry = PAYOUT_METHOD_KEYS.find(([value]) => value === method);
    return entry ? t(entry[1], entry[2]) : method;
  }

  if (payouts.length === 0) {
    return (
      <EmptyState icon={History} title={t("pages.editorFinanzas.noPayouts", "Todavía no tenés pagos cargados.")} />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("components.finance.colClient", "Cliente")}</TableHead>
            <TableHead>{t("components.finance.colAmount", "Monto")}</TableHead>
            <TableHead>{t("components.finance.colMethod", "Método")}</TableHead>
            <TableHead>{t("components.finance.colDueDate", "Fecha")}</TableHead>
            <TableHead>{t("components.finance.colStatus", "Estado")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">
                {p.client_name ?? t("components.finance.noClient", "Sin cliente puntual")}
              </TableCell>
              <TableCell className="tabular-nums">{formatCurrency(p.amount, p.currency)}</TableCell>
              <TableCell className="text-muted-foreground">{methodLabel(p.method)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(p.due_date)}</TableCell>
              <TableCell>
                {p.status === "pagado" ? (
                  <Badge variant="success">
                    <CheckCircle2 /> {t("components.finance.statusPaid", "Pagado")}
                  </Badge>
                ) : (
                  <Badge variant="info">{t("components.finance.statusPending", "Pendiente")}</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
