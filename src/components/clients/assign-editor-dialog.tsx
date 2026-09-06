"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { UserCog, Loader2 } from "lucide-react";

import { assignEditorToClientAction } from "@/app/actions/editors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Profile } from "@/types/database";

export function AssignEditorDialog({
  clientId,
  editors,
}: {
  clientId: string;
  editors: Profile[];
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [editorId, setEditorId] = React.useState<string>("");
  const [canViewChat, setCanViewChat] = React.useState(false);
  const [canViewDrive, setCanViewDrive] = React.useState(true);
  const [payAmount, setPayAmount] = React.useState<string>("");
  const [payCurrency, setPayCurrency] = React.useState<string>("ARS");
  const [payFrequency, setPayFrequency] = React.useState<string>("mensual");
  const [payDay, setPayDay] = React.useState<string>("");
  const [payNotes, setPayNotes] = React.useState<string>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!editorId) {
      toast.error(t("components.clients.chooseEditorError", "Elegí un editor"));
      return;
    }
    startTransition(async () => {
      const res = await assignEditorToClientAction({
        editorId,
        clientId,
        canViewChat,
        canViewDrive,
        payAmount: payAmount ? Number(payAmount) : null,
        payCurrency,
        payFrequency: payAmount ? (payFrequency as "mensual" | "quincenal" | "unico" | "por_entrega") : null,
        payDay: payDay ? Number(payDay) : null,
        payNotes: payNotes || null,
      });
      if (res.ok) {
        toast.success(t("components.clients.editorAssigned", "Editor asignado"));
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
        <Button size="sm" variant="outline">
          <UserCog /> {t("components.clients.assignEditor", "Asignar editor")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("components.clients.assignEditorTitle", "Asignar editor a este cliente")}</DialogTitle>
          <DialogDescription>
            {t("components.clients.assignEditorDesc", "Definí qué puede ver este editor: chat y/o Drive del cliente.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("components.clients.editorLabel", "Editor")}</Label>
            <Select value={editorId} onValueChange={setEditorId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("components.clients.chooseEditorPlaceholder", "Elegí un editor")} />
              </SelectTrigger>
              <SelectContent>
                {editors.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name || e.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={canViewDrive} onCheckedChange={(v) => setCanViewDrive(!!v)} />
            {t("components.clients.canViewDrive", "Puede ver el Drive del cliente")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={canViewChat} onCheckedChange={(v) => setCanViewChat(!!v)} />
            {t("components.clients.canViewChat", "Puede ver el chat del cliente")}
          </label>

          <div className="space-y-3 border-t border-border pt-3.5">
            <p className="text-sm font-medium">
              {t("components.clients.payRateTitle", "Pago por este cliente (opcional)")}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="assign-pay-amount">{t("components.finance.amountLabel", "Monto")}</Label>
                <Input
                  id="assign-pay-amount"
                  type="number"
                  min={0}
                  step={100}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assign-pay-currency">{t("components.finance.currencyLabel", "Moneda")}</Label>
                <Select value={payCurrency} onValueChange={setPayCurrency}>
                  <SelectTrigger id="assign-pay-currency" className="w-full">
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
                <Label htmlFor="assign-pay-frequency">{t("components.finance.frequencyLabel", "Frecuencia")}</Label>
                <Select value={payFrequency} onValueChange={setPayFrequency}>
                  <SelectTrigger id="assign-pay-frequency" className="w-full">
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
                <Label htmlFor="assign-pay-day">{t("components.finance.payDayLabel", "Día de pago (opcional)")}</Label>
                <Input
                  id="assign-pay-day"
                  type="number"
                  min={1}
                  max={31}
                  value={payDay}
                  onChange={(e) => setPayDay(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assign-pay-notes">{t("components.finance.notesLabel", "Notas (opcional)")}</Label>
              <Input id="assign-pay-notes" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {t("common.save", "Guardar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
