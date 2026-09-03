"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";

import type { InvoiceWithRelations } from "@/lib/queries/billing";
import { NewInvoiceDialog } from "@/components/billing/new-invoice-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceStatus } from "@/types/database";

type TFunc = ReturnType<typeof useLocale>["t"];

function StatusBadge({ status, daysOverdue, t }: { status: InvoiceStatus; daysOverdue: number; t: TFunc }) {
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

/**
 * Facturas de un proyecto de Sitios Web puntual — pago único/por hitos, sin
 * depender de un Plan recurrente (`billing_invoices.plan_id` queda null,
 * `web_project_id` lo asocia al proyecto). El admin puede generar una nueva
 * ya con el cliente y el proyecto fijados; el cliente ve la misma lista en
 * modo lectura (la acción de pagar/avisar pago sigue viviendo en Facturación).
 */
export function WebProjectInvoicesPanel({
  invoices,
  role,
  webProjectId,
  client,
  plans,
}: {
  invoices: InvoiceWithRelations[];
  role: "admin" | "client";
  webProjectId: string;
  client: { id: string; name: string };
  plans: { id: string; name: string }[];
}) {
  const { t } = useLocale();

  return (
    <Card className="glass-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">{t("components.webProjects.invoices", "Facturación")}</CardTitle>
        {role === "admin" && (
          <NewInvoiceDialog clients={[client]} plans={plans} webProjectId={webProjectId} lockedClient={client} />
        )}
      </CardHeader>
      <CardContent>
        {invoices.length === 0 && (
          <p className="text-muted-foreground text-sm">
            {t("components.webProjects.noInvoices", "Todavía no se facturó nada de este proyecto.")}
          </p>
        )}
        {invoices.length > 0 && (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium tabular-nums">{formatCurrency(inv.amount, inv.currency)}</p>
                  <p className="text-muted-foreground text-xs">
                    {t("billing.colDueDate", "Vencimiento")}: {formatDate(inv.due_date)}
                    {inv.notes && ` — ${inv.notes}`}
                  </p>
                </div>
                <StatusBadge status={inv.status} daysOverdue={inv.daysOverdue} t={t} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
