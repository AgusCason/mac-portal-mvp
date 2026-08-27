"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Link2, Loader2 } from "lucide-react";

import { linkClientMemberAction } from "@/app/actions/client-members";
import { Button } from "@/components/ui/button";
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
import type { Profile } from "@/types/database";

export function LinkClientMemberDialog({
  clientId,
  candidates,
}: {
  clientId: string;
  candidates: Profile[];
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [profileId, setProfileId] = React.useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!profileId) return;
    startTransition(async () => {
      const res = await linkClientMemberAction(clientId, profileId);
      if (res.ok) {
        toast.success(t("components.clients.userLinked", "Usuario vinculado al portal del cliente"));
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
        <Button size="sm" variant="outline">
          <Link2 /> {t("components.clients.linkUser", "Vincular usuario")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("components.clients.linkUserTitle", "Vincular usuario al portal")}</DialogTitle>
          <DialogDescription>
            {t(
              "components.clients.linkUserDesc",
              'El usuario tiene que estar invitado con rol "Cliente" primero (Equipo > Invitar).'
            )}
          </DialogDescription>
        </DialogHeader>
        <Select value={profileId} onValueChange={setProfileId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("components.clients.chooseUserPlaceholder", "Elegí un usuario")} />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.full_name || c.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending || !profileId}>
            {isPending && <Loader2 className="animate-spin" />}
            {t("components.clients.link", "Vincular")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
