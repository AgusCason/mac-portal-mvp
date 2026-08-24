"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

import { uploadMediaAssetAction } from "@/app/actions/media-library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { MediaFolderWithCount } from "@/lib/queries/media-library";

export function UploadAssetDialog({
  folders,
  clients,
  currentFolderId,
}: {
  folders: MediaFolderWithCount[];
  clients: { id: string; name: string }[];
  currentFolderId: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await uploadMediaAssetAction(formData);
      if (res.ok) {
        toast.success("Archivo subido");
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
          <Upload /> Subir archivo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Subir archivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="file">Archivo</Label>
            <Input id="file" name="file" type="file" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="folderId">Carpeta</Label>
            <Select name="folderId" defaultValue={currentFolderId ?? "none"}>
              <SelectTrigger id="folderId" className="w-full">
                <SelectValue placeholder="Sin carpeta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin carpeta</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clientId">Cuenta (opcional)</Label>
            <Select name="clientId" defaultValue="none">
              <SelectTrigger id="clientId" className="w-full">
                <SelectValue placeholder="Sin cuenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin cuenta</SelectItem>
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
              Subir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
