"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createContentItemAction } from "@/app/actions/content";
import { NETWORK_META } from "@/lib/network-meta";
import { CATEGORY_ORDER, getCategoryLabel } from "@/lib/content-category-meta";
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

export function NewContentDialog({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createContentItemAction(formData);
      if (res.ok) {
        toast.success(t("components.content.pieceCreated", "Pieza creada en Borrador"));
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
          <Plus /> {t("components.content.newPiece", "Nueva pieza")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.content.newPieceTitle", "Nueva pieza de contenido")}</DialogTitle>
            <DialogDescription>
              {t("components.content.newPieceDesc", 'Se crea en estado "Borrador" dentro del calendario editorial.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="clientId">{t("components.content.clientLabel", "Cliente")}</Label>
            <Select name="clientId" required>
              <SelectTrigger className="w-full" id="clientId">
                <SelectValue placeholder={t("components.content.clientSelectPlaceholder", "Seleccioná un cliente")} />
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

          <div className="space-y-1.5">
            <Label htmlFor="title">{t("components.content.titleLabel", "Título")}</Label>
            <Input id="title" name="title" required placeholder={t("components.content.titlePlaceholder", "Ej: Reel lanzamiento producto")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="network">{t("components.content.networkSelectLabel", "Red")}</Label>
            <Select name="network" required defaultValue="instagram_reel">
              <SelectTrigger className="w-full" id="network">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NETWORK_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">{t("components.content.categorySelectLabel", "Categoría (opcional)")}</Label>
            <Select name="category" defaultValue="none">
              <SelectTrigger className="w-full" id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("components.category.none", "Sin categoría")}</SelectItem>
                {CATEGORY_ORDER.map((value) => (
                  <SelectItem key={value} value={value}>
                    {getCategoryLabel(value, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scheduledAt">{t("components.content.scheduledAtLabel", "Fecha programada (opcional)")}</Label>
            <Input id="scheduledAt" name="scheduledAt" type="datetime-local" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("components.content.create", "Crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
