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
import type { Profile } from "@/types/database";

export function LinkClientMemberDialog({
  clientId,
  candidates,
}: {
  clientId: string;
  candidates: Profile[];
}) {
  const [open, setOpen] = React.useState(false);
  const [profileId, setProfileId] = React.useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!profileId) return;
    startTransition(async () => {
      const res = await linkClientMemberAction(clientId, profileId);
      if (res.ok) {
        toast.success("Usuario vinculado al portal del cliente");
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
          <Link2 /> Vincular usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular usuario al portal</DialogTitle>
          <DialogDescription>
            El usuario tiene que estar invitado con rol &quot;Cliente&quot; primero (Equipo &gt; Invitar).
          </DialogDescription>
        </DialogHeader>
        <Select value={profileId} onValueChange={setProfileId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Elegí un usuario" />
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
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
