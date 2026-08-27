"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createPlanAction } from "@/app/actions/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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

export function NewPlanDialog() {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createPlanAction(formData);
      if (res.ok) {
        toast.success(t("components.plans.planCreated", "Plan creado"));
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
          <Plus /> {t("components.plans.newPlan", "Nuevo plan")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.plans.newPlan", "Nuevo plan")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("components.plans.nameLabel", "Nombre")}</Label>
            <Input id="name" name="name" required placeholder={t("components.plans.namePlaceholder", "Ej: Growth")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("components.plans.descriptionLabel", "Descripción")}</Label>
            <Input id="description" name="description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="priceMonthly">{t("components.plans.monthlyPriceLabel", "Precio mensual")}</Label>
              <Input id="priceMonthly" name="priceMonthly" type="number" min={0} step={1000} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">{t("components.plans.currencyLabel", "Moneda")}</Label>
              <Select name="currency" defaultValue="ARS">
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
            <Label htmlFor="monthlyQuota">{t("components.plans.monthlyQuotaLabel", "Videos incluidos por mes")}</Label>
            <Input
              id="monthlyQuota"
              name="monthlyQuota"
              type="number"
              min={0}
              placeholder={t("components.plans.monthlyQuotaPlaceholder", "Ej: 12")}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("components.plans.create", "Crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
