"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";

import { PayInvoiceDialog } from "@/components/billing/pay-invoice-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import type { InvoiceWithRelations } from "@/lib/queries/billing";
import type { PaymentMethodConfig } from "@/types/database";

function StatusBadge({ status, daysOverdue }: { status: string; daysOverdue: number }) {
  if (status === "paid") {
    return (
      <Badge variant="success">
        <CheckCircle2 /> Pagada
      </Badge>
    );
  }
  if (status === "cancelled") return <Badge variant="secondary">Cancelada</Badge>;
  if (daysOverdue >= 1) {
    return (
      <Badge variant="warning">
        <AlertTriangle /> Atrasada · {daysOverdue}d
      </Badge>
    );
  }
  return <Badge variant="info">Pendiente</Badge>;
}

/**
 * Facturación del cliente (/client/facturas) — a diferencia de `InvoiceList`
 * (admin, puede marcar pagado/cancelar), esto es de solo lectura más el
 * botón "Pagar" (PayInvoiceDialog) en lo que sigue pendiente/atrasado.
 */
export function ClientInvoiceList({
  invoices,
  enabledMethods,
}: {
  invoices: InvoiceWithRelations[];
  enabledMethods: PaymentMethodConfig[];
}) {
  const { t } = useLocale();

  if (invoices.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {t("billing.noInvoices", "Todavía no tenés facturas.")}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Pagar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="text-muted-foreground">{inv.plan_name ?? "—"}</TableCell>
              <TableCell className="tabular-nums font-medium">
                {formatCurrency(inv.amount, inv.currency)}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(inv.due_date)}</TableCell>
              <TableCell>
                <StatusBadge status={inv.status} daysOverdue={inv.daysOverdue} />
              </TableCell>
              <TableCell className="text-right">
                {(inv.status === "pending" || inv.status === "overdue") && (
                  <PayInvoiceDialog invoice={inv} methods={enabledMethods} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
