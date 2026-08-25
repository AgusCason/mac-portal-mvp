"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createContentItemAction } from "@/app/actions/content";
import { NETWORK_META } from "@/lib/network-meta";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/content-category-meta";
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

export function NewContentDialog({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createContentItemAction(formData);
      if (res.ok) {
        toast.success("Pieza creada en Borrador");
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
          <Plus /> Nueva pieza
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nueva pieza de contenido</DialogTitle>
            <DialogDescription>
              Se crea en estado &quot;Borrador&quot; dentro del calendario editorial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="clientId">Cliente</Label>
            <Select name="clientId" required>
              <SelectTrigger className="w-full" id="clientId">
                <SelectValue placeholder="Seleccioná un cliente" />
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
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required placeholder="Ej: Reel lanzamiento producto" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="network">Red</Label>
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
            <Label htmlFor="category">Categoría (opcional)</Label>
            <Select name="category" defaultValue="none">
              <SelectTrigger className="w-full" id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría</SelectItem>
                {CATEGORY_ORDER.map((value) => (
                  <SelectItem key={value} value={value}>
                    {CATEGORY_META[value].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scheduledAt">Fecha programada (opcional)</Label>
            <Input id="scheduledAt" name="scheduledAt" type="datetime-local" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
