"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createClientAction } from "@/app/actions/clients";
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
import type { Plan } from "@/types/database";

export function NewClientDialog({ plans }: { plans: Plan[] }) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createClientAction(formData);
      if (res.ok) {
        toast.success("Cliente creado — carpetas de Drive en camino");
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
          <Plus /> Nuevo cliente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
            <DialogDescription>
              Crea el cliente y su estructura de carpetas en Google Drive (Crudos,
              En Edición, Entregables Finales) automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre / razón social</Label>
            <Input id="name" name="name" required placeholder="Ej: Estudio Fit SRL" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brandName">Nombre de marca</Label>
            <Input id="brandName" name="brandName" placeholder="Ej: Estudio Fit" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Email de contacto</Label>
              <Input id="contactEmail" name="contactEmail" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">Teléfono</Label>
              <Input id="contactPhone" name="contactPhone" placeholder="+549..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="planId">Plan (opcional)</Label>
            <Select name="planId">
              <SelectTrigger className="w-full" id="planId">
                <SelectValue placeholder="Sin plan asignado" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Crear cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
