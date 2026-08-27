"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createCompetitorAction } from "@/app/actions/competitors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CompetitorFormFields } from "@/components/competitors/competitor-form-fields";
import { useLocale } from "@/lib/i18n/locale-context";

export function NewCompetitorDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createCompetitorAction(formData);
      if (res.ok) {
        toast.success(t("components.competitors.competitorAdded", "Competidor agregado"));
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
          <Plus /> {t("components.competitors.newCompetitor", "Nuevo competidor")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.competitors.newCompetitor", "Nuevo competidor")}</DialogTitle>
          </DialogHeader>
          <CompetitorFormFields clients={clients} />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("common.add", "Agregar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
