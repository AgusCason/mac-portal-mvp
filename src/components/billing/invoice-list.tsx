"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle, AlertTriangle, Download } from "lucide-react";

import type { InvoiceWithRelations } from "@/lib/queries/billing";
import { markInvoicePaidAction, cancelInvoiceAction, getInvoicePdfAction } from "@/app/actions/billing";
import { downloadBase64File } from "@/lib/download-file";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import { PAYMENT_METHOD_LABELS as METHOD_LABELS } from "@/lib/billing-labels";

function StatusBadge({
  status,
  daysOverdue,
  t,
}: {
  status: string;
  daysOverdue: number;
  t: (path: string, fallback?: string) => string;
}) {
  if (status === "paid") {
    return (
      <Badge variant="success">
        <CheckCircle2 /> {t("billing.statusPaid", "Pagada")}
      </Badge>
    );
  }
  if (status === "cancelled") {
    return <Badge variant="secondary">{t("billing.statusCancelled", "Cancelada")}</Badge>;
  }
  if (daysOverdue >= 15) {
    return (
      <Badge variant="destructive">
        <AlertTriangle /> {t("billing.statusOverdueSevere", "Moroso")} · {daysOverdue}d
      </Badge>
    );
  }
  if (daysOverdue >= 1) {
    return (
      <Badge variant="warning">
        <AlertTriangle /> {t("billing.statusOverdue", "Atrasada")} · {daysOverdue}d
      </Badge>
    );
  }
  return <Badge variant="info">{t("billing.statusPending", "Pendiente")}</Badge>;
}

export function InvoiceList({ invoices }: { invoices: InvoiceWithRelations[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markPaid(id: string) {
    startTransition(async () => {
      const res = await markInvoicePaidAction(id);
      if (res.ok) {
        toast.success(t("billing.paymentRegistered", "Pago registrado"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function cancel(id: string) {
    startTransition(async () => {
      const res = await cancelInvoiceAction(id);
      if (res.ok) {
        toast.success(t("billing.invoiceCancelled", "Factura cancelada"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function downloadPdf(id: string) {
    startTransition(async () => {
      const res = await getInvoicePdfAction(id);
      if (res.ok) {
        downloadBase64File(res.base64, res.filename, "application/pdf");
      } else {
        toast.error(res.error);
      }
    });
  }

  if (invoices.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("billing.noInvoicesAdmin", "Todavía no hay facturas cargadas.")}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("billing.colClient", "Cliente")}</TableHead>
          <TableHead>{t("billing.colPlan", "Plan")}</TableHead>
          <TableHead>{t("billing.colAmount", "Monto")}</TableHead>
          <TableHead>{t("billing.colMethod", "Método")}</TableHead>
          <TableHead>{t("billing.colDueDate", "Vencimiento")}</TableHead>
          <TableHead>{t("billing.colStatus", "Estado")}</TableHead>
          <TableHead className="text-right">{t("billing.colActions", "Acciones")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-medium">{inv.client_name}</TableCell>
            <TableCell className="text-muted-foreground">{inv.plan_name ?? "—"}</TableCell>
            <TableCell className="tabular-nums">{formatCurrency(inv.amount, inv.currency)}</TableCell>
            <TableCell className="text-muted-foreground">{METHOD_LABELS[inv.method] ?? inv.method}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(inv.due_date)}</TableCell>
            <TableCell>
              <StatusBadge status={inv.status} daysOverdue={inv.daysOverdue} t={t} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1.5">
                {(inv.status === "pending" || inv.status === "overdue") && (
                  <>
                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => markPaid(inv.id)}>
                      {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                      {t("billing.markPaymentReceived", "Marcar pago recibido")}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => cancel(inv.id)}
                      title={t("billing.cancelInvoiceTitle", "Cancelar factura")}
                    >
                      <XCircle />
                    </Button>
                  </>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => downloadPdf(inv.id)}
                  title={t("billing.downloadPdfTitle", "Descargar PDF")}
                >
                  <Download />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
