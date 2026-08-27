"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createWebFormAction } from "@/app/actions/web-forms";
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
import { useLocale } from "@/lib/i18n/locale-context";

export function NewWebFormDialog() {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createWebFormAction(formData);
      if (res.ok) {
        toast.success(t("components.webForms.formCreated", "Formulario creado"));
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
          <Plus /> {t("components.webForms.newForm", "Nuevo formulario")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.webForms.newFormTitle", "Nuevo formulario")}</DialogTitle>
            <DialogDescription>{t("components.webForms.newFormDesc", "Generá un link público para recibir respuestas.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("components.webForms.nameLabel", "Nombre")}</Label>
            <Input id="name" name="name" required placeholder={t("components.webForms.namePlaceholder", "Ej: Contacto - Landing")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("components.webForms.descriptionLabel", "Descripción")}</Label>
            <Input id="description" name="description" placeholder={t("components.webForms.descriptionPlaceholder", "Se muestra arriba del formulario")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("components.webForms.create", "Crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
