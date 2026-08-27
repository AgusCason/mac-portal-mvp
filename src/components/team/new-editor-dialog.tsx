"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";

import { createEditorAction } from "@/app/actions/editors";
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

/**
 * Alta de Editor — aprovisionamiento automático (ver `createEditorAction`):
 * le llega un email real para setear su contraseña, y su perfil queda listo
 * para que el admin lo asigne a clientes desde esta misma pantalla.
 */
export function NewEditorDialog() {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createEditorAction(formData);
      if (res.ok) {
        toast.success(
          res.alreadyExisted
            ? t("components.team.editorLinked", "Ya existía una cuenta con ese email — se vinculó como editor.")
            : t("components.team.invitationSent", "Invitación enviada por email.")
        );
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
          <UserPlus /> {t("components.team.inviteEditor", "Invitar editor")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.team.inviteEditor", "Invitar editor")}</DialogTitle>
            <DialogDescription>
              {t(
                "components.team.inviteEditorDesc",
                "Le llega un email para crear su contraseña. No va a ver ningún cliente hasta que se lo asignes desde acá."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="fullName">{t("components.team.fullNameLabel", "Nombre completo")}</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("components.team.emailLabel", "Email")}</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("components.team.sendInvitation", "Enviar invitación")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
