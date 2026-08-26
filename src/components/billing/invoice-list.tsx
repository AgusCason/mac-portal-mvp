"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle, AlertTriangle } from "lucide-react";

import type { InvoiceWithRelations } from "@/lib/queries/billing";
import { markInvoicePaidAction, cancelInvoiceAction } from "@/app/actions/billing";
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
import { PAYMENT_METHOD_LABELS as METHOD_LABELS } from "@/lib/billing-labels";

function StatusBadge({ status, daysOverdue }: { status: string; daysOverdue: number }) {
  if (status === "paid") {
    return (
      <Badge variant="success">
        <CheckCircle2 /> Pagada
      </Badge>
    );
  }
  if (status === "cancelled") {
    return <Badge variant="secondary">Cancelada</Badge>;
  }
  if (daysOverdue >= 15) {
    return (
      <Badge variant="destructive">
        <AlertTriangle /> Moroso · {daysOverdue}d
      </Badge>
    );
  }
  if (daysOverdue >= 1) {
    return (
      <Badge variant="warning">
        <AlertTriangle /> Atrasada · {daysOverdue}d
      </Badge>
    );
  }
  return <Badge variant="info">Pendiente</Badge>;
}

export function InvoiceList({ invoices }: { invoices: InvoiceWithRelations[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markPaid(id: string) {
    startTransition(async () => {
      const res = await markInvoicePaidAction(id);
      if (res.ok) {
        toast.success("Pago registrado");
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
        toast.success("Factura cancelada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (invoices.length === 0) {
    return <p className="text-muted-foreground text-sm">Todavía no hay facturas cargadas.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Vencimiento</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
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
              <StatusBadge status={inv.status} daysOverdue={inv.daysOverdue} />
            </TableCell>
            <TableCell className="text-right">
              {(inv.status === "pending" || inv.status === "overdue") && (
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => markPaid(inv.id)}>
                    {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                    Marcar pago recibido
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => cancel(inv.id)}
                    title="Cancelar factura"
                  >
                    <XCircle />
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
