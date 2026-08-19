"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { UserCog, Loader2 } from "lucide-react";

import { assignEditorToClientAction } from "@/app/actions/editors";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

export function AssignEditorDialog({
  clientId,
  editors,
}: {
  clientId: string;
  editors: Profile[];
}) {
  const [open, setOpen] = React.useState(false);
  const [editorId, setEditorId] = React.useState<string>("");
  const [canViewChat, setCanViewChat] = React.useState(false);
  const [canViewDrive, setCanViewDrive] = React.useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!editorId) {
      toast.error("Elegí un editor");
      return;
    }
    startTransition(async () => {
      const res = await assignEditorToClientAction({
        editorId,
        clientId,
        canViewChat,
        canViewDrive,
      });
      if (res.ok) {
        toast.success("Editor asignado");
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
          <UserCog /> Asignar editor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar editor a este cliente</DialogTitle>
          <DialogDescription>
            Definí qué puede ver este editor: chat y/o Drive del cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Editor</Label>
            <Select value={editorId} onValueChange={setEditorId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí un editor" />
              </SelectTrigger>
              <SelectContent>
                {editors.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name || e.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={canViewDrive} onCheckedChange={(v) => setCanViewDrive(!!v)} />
            Puede ver el Drive del cliente
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={canViewChat} onCheckedChange={(v) => setCanViewChat(!!v)} />
            Puede ver el chat del cliente
          </label>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
