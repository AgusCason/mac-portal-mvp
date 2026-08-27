"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createWebProjectAction } from "@/app/actions/web-projects";
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

export function NewWebProjectDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createWebProjectAction(formData);
      if (res.ok) {
        toast.success(t("components.webProjects.projectCreated", "Proyecto creado"));
        setOpen(false);
        router.push(`/admin/sitios-web/${res.projectId}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> {t("components.webProjects.newProject", "Nuevo sitio web")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.webProjects.newProject", "Nuevo sitio web")}</DialogTitle>
            <DialogDescription>
              {t("components.webProjects.newProjectDesc", 'Arranca en la etapa "Brief".')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="title">{t("components.webProjects.titleLabel", "Título")}</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder={t("components.webProjects.titlePlaceholder", "Ej: Sitio institucional")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("components.webProjects.descriptionLabel", "Descripción")}</Label>
            <Input id="description" name="description" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clientId">{t("components.webProjects.clientLabel", "Cliente")}</Label>
            <Select name="clientId" required>
              <SelectTrigger id="clientId" className="w-full">
                <SelectValue placeholder={t("components.webProjects.clientPlaceholder", "Seleccioná un cliente")} />
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
              {t("components.webProjects.create", "Crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
