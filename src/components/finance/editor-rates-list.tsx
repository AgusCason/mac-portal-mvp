"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Loader2, Wallet } from "lucide-react";

import type { EditorClientRate } from "@/lib/queries/editor-finance";
import { updateAssignmentPayAction } from "@/app/actions/editor-finance";
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
import { formatCurrency, cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

const FREQUENCY_LABEL_KEYS: Record<string, [string, string]> = {
  mensual: ["components.finance.frequencyMonthly", "Mensual"],
  quincenal: ["components.finance.frequencyBiweekly", "Quincenal"],
  unico: ["components.finance.frequencyOnce", "Pago único"],
  por_entrega: ["components.finance.frequencyPerDelivery", "Por entrega"],
};

function frequencyLabel(freq: string | null, t: (path: string, fallback?: string) => string) {
  if (!freq) return "—";
  const entry = FREQUENCY_LABEL_KEYS[freq];
  return entry ? t(entry[0], entry[1]) : freq;
}

function EditRateDialog({ rate }: { rate: EditorClientRate }) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateAssignmentPayAction(rate.assignmentId, formData);
      if (res.ok) {
        toast.success(t("components.finance.rateSaved", "Tarifa guardada"));
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
        <Button size="icon" variant="ghost" aria-label={t("components.finance.editRateAria", "Editar tarifa")}>
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {t("components.finance.editRateTitle", "Tarifa por")} {rate.clientName}
            </DialogTitle>
            <DialogDescription>
              {t(
                "components.finance.editRateDesc",
                "Cuánto se le paga a este editor por este cliente, y cada cuánto."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="payAmount">{t("components.finance.amountLabel", "Monto")}</Label>
              <Input
                id="payAmount"
                name="payAmount"
                type="number"
                min={0}
                step={100}
                defaultValue={rate.amount ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payCurrency">{t("components.finance.currencyLabel", "Moneda")}</Label>
              <Select name="payCurrency" defaultValue={rate.currency || "ARS"}>
                <SelectTrigger id="payCurrency" className="w-full">
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
              <Label htmlFor="payFrequency">{t("components.finance.frequencyLabel", "Frecuencia")}</Label>
              <Select name="payFrequency" defaultValue={rate.frequency ?? "mensual"}>
                <SelectTrigger id="payFrequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">{t("components.finance.frequencyMonthly", "Mensual")}</SelectItem>
                  <SelectItem value="quincenal">{t("components.finance.frequencyBiweekly", "Quincenal")}</SelectItem>
                  <SelectItem value="unico">{t("components.finance.frequencyOnce", "Pago único")}</SelectItem>
                  <SelectItem value="por_entrega">
                    {t("components.finance.frequencyPerDelivery", "Por entrega")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payDay">{t("components.finance.payDayLabel", "Día de pago (opcional)")}</Label>
              <Input id="payDay" name="payDay" type="number" min={1} max={31} defaultValue={rate.paymentDay ?? ""} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payNotes">{t("components.finance.notesLabel", "Notas (opcional)")}</Label>
            <Input id="payNotes" name="payNotes" defaultValue={rate.notes ?? ""} />
          </div>

          <DialogFooter>
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

/** Tarifas por cliente de un editor — panel individual de Finanzas de Equipo. */
export function EditorRatesList({ rates }: { rates: EditorClientRate[] }) {
  const { t } = useLocale();

  if (rates.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title={t("components.finance.noRates", "Este editor todavía no tiene clientes asignados.")}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("components.finance.colClient", "Cliente")}</TableHead>
          <TableHead>{t("components.finance.colAmount", "Monto")}</TableHead>
          <TableHead>{t("components.finance.colFrequency", "Frecuencia")}</TableHead>
          <TableHead>{t("components.finance.colPayDay", "Día de pago")}</TableHead>
          <TableHead className="text-right">{t("components.finance.colActions", "Acciones")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rates.map((r) => (
          <TableRow key={r.assignmentId}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {r.clientName}
                {r.clientStatus !== "active" && (
                  <Badge variant="secondary" className="text-[10px]">
                    {r.clientStatus}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className={cn("tabular-nums", r.amount == null && "text-muted-foreground")}>
              {r.amount != null ? formatCurrency(r.amount, r.currency) : t("components.finance.noAmount", "Sin definir")}
            </TableCell>
            <TableCell className="text-muted-foreground">{frequencyLabel(r.frequency, t)}</TableCell>
            <TableCell className="text-muted-foreground">{r.paymentDay ?? "—"}</TableCell>
            <TableCell className="text-right">
              <EditRateDialog rate={r} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
