"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createInvoiceAction } from "@/app/actions/billing";
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

export function NewInvoiceDialog({
  clients,
  plans,
  webProjectId,
  lockedClient,
}: {
  clients: { id: string; name: string }[];
  plans: { id: string; name: string }[];
  /** Preselecciona el proyecto de Sitios Web al que va a quedar asociada la factura. */
  webProjectId?: string;
  /** Cuando se invoca desde la ficha de un proyecto, fija el cliente (no editable). */
  lockedClient?: { id: string; name: string };
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const METHOD_OPTIONS = [
    { value: "mercadopago", label: t("billing.methodMercadopagoAuto", "Mercado Pago (automático)") },
    { value: "paypal", label: t("billing.methodPaypalAuto", "PayPal (automático)") },
    { value: "transferencia", label: t("billing.methodTransfer", "Transferencia") },
    { value: "payoneer", label: t("billing.methodPayoneer", "Payoneer") },
    { value: "crypto", label: t("billing.methodCrypto", "Cripto") },
    { value: "otro", label: t("billing.methodOther", "Otro") },
  ];

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createInvoiceAction(formData);
      if (res.ok) {
        toast.success(t("billing.invoiceGenerated", "Factura generada"));
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
          <Plus /> {t("billing.generateInvoice", "Generar factura")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("billing.generateInvoice", "Generar factura")}</DialogTitle>
            <DialogDescription>
              {t(
                "billing.generateInvoiceDesc",
                "Mercado Pago y PayPal se concilian automáticamente cuando esté disponible; el resto de los métodos se marcan como pagados manualmente."
              )}
            </DialogDescription>
          </DialogHeader>

          {webProjectId && <input type="hidden" name="webProjectId" value={webProjectId} />}

          {lockedClient ? (
            <div className="space-y-1.5">
              <Label>{t("billing.clientLabel", "Cliente")}</Label>
              <input type="hidden" name="clientId" value={lockedClient.id} />
              <p className="border-input rounded-lg border bg-transparent px-3 py-2 text-sm">
                {lockedClient.name}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="clientId">{t("billing.clientLabel", "Cliente")}</Label>
              <Select name="clientId" required>
                <SelectTrigger className="w-full" id="clientId">
                  <SelectValue placeholder={t("billing.chooseClientPlaceholder", "Seleccioná un cliente")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="planId">{t("billing.planOptionalLabel", "Plan (opcional)")}</Label>
            <Select name="planId">
              <SelectTrigger className="w-full" id="planId">
                <SelectValue placeholder={t("billing.noPlanPlaceholder", "Sin plan asociado")} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">{t("billing.amountLabel", "Monto")}</Label>
              <Input id="amount" name="amount" type="number" min={0} step={100} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">{t("billing.currencyLabel", "Moneda")}</Label>
              <Select name="currency" defaultValue="ARS" required>
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">{t("billing.currencyArs", "Pesos (ARS)")}</SelectItem>
                  <SelectItem value="USD">{t("billing.currencyUsd", "Dólares (USD)")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="method">{t("billing.paymentMethodLabel", "Método de pago")}</Label>
            <Select name="method" required defaultValue="transferencia">
              <SelectTrigger className="w-full" id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueDate">{t("billing.dueDateLabel", "Vencimiento")}</Label>
            <Input id="dueDate" name="dueDate" type="date" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("billing.notesOptionalLabel", "Notas (opcional)")}</Label>
            <Input id="notes" name="notes" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("billing.generate", "Generar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
