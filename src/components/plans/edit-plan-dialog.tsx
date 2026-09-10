"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";

import { updatePlanAction } from "@/app/actions/plans";
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
import type { Plan } from "@/types/database";

/**
 * Edita un plan existente — mismo formulario que <NewPlanDialog />, pero
 * precargado con los valores actuales y apuntando a `updatePlanAction`.
 * Antes de esto, `plans` solo tenía flujo de creación: no había ningún
 * botón ni Server Action para modificar un plan ya creado.
 */
export function EditPlanDialog({ plan }: { plan: Plan }) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updatePlanAction(plan.id, formData);
      if (res.ok) {
        toast.success(t("components.plans.planUpdated", "Plan actualizado"));
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label={t("components.plans.editPlan", "Editar plan")}
        >
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.plans.editPlan", "Editar plan")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor={`name-${plan.id}`}>{t("components.plans.nameLabel", "Nombre")}</Label>
            <Input
              id={`name-${plan.id}`}
              name="name"
              required
              defaultValue={plan.name}
              placeholder={t("components.plans.namePlaceholder", "Ej: Growth")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`description-${plan.id}`}>
              {t("components.plans.descriptionLabel", "Descripción")}
            </Label>
            <Input id={`description-${plan.id}`} name="description" defaultValue={plan.description ?? ""} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`priceMonthly-${plan.id}`}>
                {t("components.plans.monthlyPriceLabel", "Precio mensual")}
              </Label>
              <Input
                id={`priceMonthly-${plan.id}`}
                name="priceMonthly"
                type="number"
                min={0}
                step={1000}
                required
                defaultValue={plan.price_monthly}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`currency-${plan.id}`}>{t("components.plans.currencyLabel", "Moneda")}</Label>
              <Select name="currency" defaultValue={plan.currency}>
                <SelectTrigger id={`currency-${plan.id}`} className="w-full">
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
            <Label htmlFor={`monthlyQuota-${plan.id}`}>
              {t("components.plans.monthlyQuotaLabel", "Videos incluidos por mes")}
            </Label>
            <Input
              id={`monthlyQuota-${plan.id}`}
              name="monthlyQuota"
              type="number"
              min={0}
              defaultValue={plan.monthly_quota ?? ""}
              placeholder={t("components.plans.monthlyQuotaPlaceholder", "Ej: 12")}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("components.plans.save", "Guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
