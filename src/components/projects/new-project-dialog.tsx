"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createProjectAction } from "@/app/actions/projects";
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

export function NewProjectDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createProjectAction(formData);
      if (res.ok) {
        toast.success(t("components.projects.projectCreated", "Proyecto creado"));
        setOpen(false);
        router.push(`/admin/proyectos/${res.projectId}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> {t("components.projects.newProject", "Nuevo proyecto")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.projects.newProject", "Nuevo proyecto")}</DialogTitle>
            <DialogDescription>{t("components.projects.newProjectDesc", 'Arranca en la etapa "Por iniciar".')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="title">{t("components.projects.titleLabel", "Título")}</Label>
            <Input id="title" name="title" required placeholder={t("components.projects.titlePlaceholder", "Ej: Apertura corredor Asia-Pacífico")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("components.projects.descriptionLabel", "Descripción")}</Label>
            <Input id="description" name="description" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clientId">{t("components.projects.accountOptionalLabel", "Cuenta (opcional)")}</Label>
            <Select name="clientId">
              <SelectTrigger id="clientId" className="w-full">
                <SelectValue placeholder={t("components.projects.internalProjectPlaceholder", "Proyecto interno de la agencia")} />
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
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("components.projects.create", "Crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
