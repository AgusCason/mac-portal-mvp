"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createPayoutAction } from "@/app/actions/editor-finance";
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

export function NewPayoutDialog({
  editorId,
  clients,
}: {
  editorId: string;
  clients: { id: string; name: string }[];
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<"pendiente" | "pagado">("pendiente");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createPayoutAction(formData);
      if (res.ok) {
        toast.success(t("components.finance.payoutSaved", "Pago registrado"));
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
        <Button size="sm">
          <Plus /> {t("components.finance.newPayout", "Nuevo pago")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.finance.newPayoutTitle", "Nuevo pago")}</DialogTitle>
            <DialogDescription>
              {t(
                "components.finance.newPayoutDesc",
                "Cargá un pago ya hecho, o uno pendiente con la fecha en la que se espera pagarlo."
              )}
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="editorId" value={editorId} />

          <div className="space-y-1.5">
            <Label htmlFor="clientId">{t("components.finance.clientOptionalLabel", "Cliente (opcional)")}</Label>
            <Select name="clientId" defaultValue="none">
              <SelectTrigger className="w-full" id="clientId">
                <SelectValue placeholder={t("components.finance.noClient", "Sin cliente puntual")} />
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
              <Label htmlFor="amount">{t("components.finance.amountLabel", "Monto")}</Label>
              <Input id="amount" name="amount" type="number" min={0} step={100} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">{t("components.finance.currencyLabel", "Moneda")}</Label>
              <Select name="currency" defaultValue="ARS" required>
                <SelectTrigger id="currency" className="w-full">
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
              <Label htmlFor="status">{t("components.finance.statusLabel", "Estado")}</Label>
              <Select name="status" value={status} onValueChange={(v) => setStatus(v as "pendiente" | "pagado")}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">{t("components.finance.statusPending", "Pendiente")}</SelectItem>
                  <SelectItem value="pagado">{t("components.finance.statusPaid", "Pagado")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">
                {status === "pagado"
                  ? t("components.finance.paidDateLabel", "Fecha de pago")
                  : t("components.finance.dueDateLabel", "Fecha esperada")}
              </Label>
              <Input id="dueDate" name="dueDate" type="date" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="method">{t("components.finance.methodOptionalLabel", "Método (opcional)")}</Label>
            <Select name="method" defaultValue="transferencia">
              <SelectTrigger className="w-full" id="method">
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
            <Label htmlFor="periodLabel">{t("components.finance.periodLabel", "Período (opcional)")}</Label>
            <Input id="periodLabel" name="periodLabel" placeholder={t("components.finance.periodPlaceholder", "Ej: Agosto 2026")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("components.finance.notesLabel", "Notas (opcional)")}</Label>
            <Input id="notes" name="notes" />
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
