"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createContractAction } from "@/app/actions/contracts";
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

export function NewContractDialog({
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
      const res = await createContractAction(formData);
      if (res.ok) {
        toast.success(t("components.contracts.contractUploaded", "Contrato cargado"));
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
          <Plus /> {t("components.contracts.uploadContract", "Cargar contrato")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.contracts.uploadContractTitle", "Cargar contrato")}</DialogTitle>
            <DialogDescription>
              {t("components.contracts.uploadContractDesc", "Subí el PDF a Drive/Storage primero y pegá acá el link público de vista.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="clientId">{t("components.contracts.clientLabel", "Cliente")}</Label>
            <Select name="clientId" required>
              <SelectTrigger className="w-full" id="clientId">
                <SelectValue placeholder={t("components.contracts.clientPlaceholder", "Seleccioná un cliente")} />
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
            <Label htmlFor="title">{t("components.contracts.titleLabel", "Título")}</Label>
            <Input id="title" name="title" required placeholder={t("components.contracts.titlePlaceholder", "Ej: Contrato de prestación de servicios")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fileUrl">{t("components.contracts.fileUrlLabel", "URL del documento (PDF)")}</Label>
            <Input id="fileUrl" name="fileUrl" type="url" required placeholder="https://..." />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("common.save", "Guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
