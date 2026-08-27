"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createContentIdeaAction } from "@/app/actions/content-ideas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IdeaFormFields } from "@/components/content-studio/idea-form-fields";
import { useLocale } from "@/lib/i18n/locale-context";

export function NewIdeaDialog({
  clients,
  defaultType,
}: {
  clients: { id: string; name: string }[];
  defaultType?: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createContentIdeaAction(formData);
      if (res.ok) {
        toast.success(t("components.contentStudio.ideaAdded", "Idea agregada"));
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
          <Plus /> {t("components.contentStudio.newIdea", "Nueva idea")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.contentStudio.newIdea", "Nueva idea")}</DialogTitle>
          </DialogHeader>
          <IdeaFormFields clients={clients} defaultType={defaultType} />
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
