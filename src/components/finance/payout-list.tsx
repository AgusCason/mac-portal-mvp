"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Pencil, Trash2 } from "lucide-react";

import type { EditorPayoutWithClient } from "@/lib/queries/editor-finance";
import {
  markPayoutPaidAction,
  updatePayoutAction,
  deletePayoutAction,
} from "@/app/actions/editor-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { History } from "lucide-react";
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

function methodLabel(method: string | null, t: (path: string, fallback?: string) => string) {
  if (!method) return "—";
  const entry = PAYOUT_METHOD_KEYS.find(([value]) => value === method);
  return entry ? t(entry[1], entry[2]) : method;
}

function EditPayoutDialog({
  payout,
  clients,
}: {
  payout: EditorPayoutWithClient;
  clients: { id: string; name: string }[];
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updatePayoutAction(payout.id, formData);
      if (res.ok) {
        toast.success(t("components.finance.payoutUpdated", "Pago actualizado"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deletePayoutAction(payout.id);
      if (res.ok) {
        toast.success(t("components.finance.payoutDeleted", "Pago eliminado"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={t("components.finance.editPayoutAria", "Editar pago")}>
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.finance.editPayoutTitle", "Editar pago")}</DialogTitle>
            <DialogDescription>
              {t("components.finance.editPayoutDesc", "Corregí el monto, la fecha o el estado de este pago.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor={`clientId-${payout.id}`}>{t("components.finance.clientOptionalLabel", "Cliente (opcional)")}</Label>
            <Select name="clientId" defaultValue={payout.client_id ?? "none"}>
              <SelectTrigger className="w-full" id={`clientId-${payout.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("components.finance.noClient", "Sin cliente puntual")}</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`amount-${payout.id}`}>{t("components.finance.amountLabel", "Monto")}</Label>
              <Input id={`amount-${payout.id}`} name="amount" type="number" min={0} step={100} defaultValue={payout.amount} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`currency-${payout.id}`}>{t("components.finance.currencyLabel", "Moneda")}</Label>
              <Select name="currency" defaultValue={payout.currency}>
                <SelectTrigger id={`currency-${payout.id}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">{t("components.finance.currencyArs", "Pesos (ARS)")}</SelectItem>
                  <SelectItem value="USD">{t("components.finance.currencyUsd", "Dólares (USD)")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`status-${payout.id}`}>{t("components.finance.statusLabel", "Estado")}</Label>
              <Select name="status" defaultValue={payout.status}>
                <SelectTrigger id={`status-${payout.id}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">{t("components.finance.statusPending", "Pendiente")}</SelectItem>
                  <SelectItem value="pagado">{t("components.finance.statusPaid", "Pagado")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`dueDate-${payout.id}`}>{t("components.finance.dueDateLabel", "Fecha esperada")}</Label>
              <Input id={`dueDate-${payout.id}`} name="dueDate" type="date" defaultValue={payout.due_date} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`method-${payout.id}`}>{t("components.finance.methodOptionalLabel", "Método (opcional)")}</Label>
            <Select name="method" defaultValue={payout.method ?? "transferencia"}>
              <SelectTrigger className="w-full" id={`method-${payout.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYOUT_METHOD_KEYS.map(([value, key, fallback]) => (
                  <SelectItem key={value} value={value}>
                    {t(key, fallback)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`periodLabel-${payout.id}`}>{t("components.finance.periodLabel", "Período (opcional)")}</Label>
            <Input id={`periodLabel-${payout.id}`} name="periodLabel" defaultValue={payout.period_label ?? ""} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`notes-${payout.id}`}>{t("components.finance.notesLabel", "Notas (opcional)")}</Label>
            <Input id={`notes-${payout.id}`} name="notes" defaultValue={payout.notes ?? ""} />
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              <Trash2 /> {t("common.delete", "Eliminar")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("common.save", "Guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Historial de pagos de un editor — panel individual de Finanzas de Equipo (admin). */
export function PayoutList({
  payouts,
  clients,
}: {
  payouts: EditorPayoutWithClient[];
  clients: { id: string; name: string }[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markPaid(id: string) {
    startTransition(async () => {
      const res = await markPayoutPaidAction(id);
      if (res.ok) {
        toast.success(t("components.finance.paymentRegistered", "Pago marcado como pagado"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (payouts.length === 0) {
    return (
      <EmptyState icon={History} title={t("components.finance.noPayouts", "Todavía no hay pagos cargados.")} />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("components.finance.colClient", "Cliente")}</TableHead>
          <TableHead>{t("components.finance.colAmount", "Monto")}</TableHead>
          <TableHead>{t("components.finance.colMethod", "Método")}</TableHead>
          <TableHead>{t("components.finance.colDueDate", "Fecha")}</TableHead>
          <TableHead>{t("components.finance.colStatus", "Estado")}</TableHead>
          <TableHead className="text-right">{t("components.finance.colActions", "Acciones")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payouts.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.client_name ?? t("components.finance.noClient", "Sin cliente puntual")}</TableCell>
            <TableCell className="tabular-nums">{formatCurrency(p.amount, p.currency)}</TableCell>
            <TableCell className="text-muted-foreground">{methodLabel(p.method, t)}</TableCell>
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
            <TableCell className="text-right">
              <div className="flex justify-end gap-1.5">
                {p.status === "pendiente" && (
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => markPaid(p.id)}>
                    {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                    {t("components.finance.markPaid", "Marcar pagado")}
                  </Button>
                )}
                <EditPayoutDialog payout={p} clients={clients} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
