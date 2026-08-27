"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { FolderPlus, Loader2 } from "lucide-react";

import { createMediaFolderAction } from "@/app/actions/media-library";
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
import { useLocale } from "@/lib/i18n/locale-context";

const COLOR_SWATCH: Record<string, string> = {
  gray: "bg-gray-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
};
const COLORS = Object.keys(COLOR_SWATCH);

export function NewFolderDialog() {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [color, setColor] = React.useState("gray");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    formData.set("color", color);
    startTransition(async () => {
      const res = await createMediaFolderAction(formData);
      if (res.ok) {
        toast.success(t("components.mediaLibrary.folderCreated", "Carpeta creada"));
        setOpen(false);
        setColor("gray");
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
          <FolderPlus /> {t("components.mediaLibrary.newFolder", "Nueva carpeta")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.mediaLibrary.newFolderTitle", "Nueva carpeta")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("components.mediaLibrary.nameLabel", "Nombre")}</Label>
            <Input id="name" name="name" required placeholder={t("components.mediaLibrary.namePlaceholder", "Ej: Assets Cliente X")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("components.mediaLibrary.colorLabel", "Color")}</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`${COLOR_SWATCH[c]} size-6 rounded-full border-2 ${
                    color === c ? "border-foreground" : "border-transparent"
                  }`}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("components.mediaLibrary.create", "Crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
