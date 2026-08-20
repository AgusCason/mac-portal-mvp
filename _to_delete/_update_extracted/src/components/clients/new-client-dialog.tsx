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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Plan } from "@/types/database";

export function NewClientDialog({ plans }: { plans: Plan[] }) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const [driveMode, setDriveMode] = React.useState<"auto" | "linked">("auto");
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createClientAction(formData);
      if (res.ok) {
        toast.success(
          res.alreadyExisted
            ? "Cliente creado — ya existía una cuenta con ese email, se vinculó."
            : "Cliente creado — le llegó el email de invitación y las carpetas de Drive en camino."
        );
        setOpen(false);
        setDriveMode("auto");
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
      <DialogContent className="max-h-[85vh]">
        <form action={handleSubmit} className="flex max-h-[80vh] flex-col">
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
            <DialogDescription>
              Se le envía una invitación real por email para acceder a su portal, y se
              crea su estructura de carpetas en Google Drive (Crudos, En Edición,
              Entregables Finales) automáticamente.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-4 py-2">
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
                  <Label htmlFor="contactFullName">Nombre y apellido del contacto</Label>
                  <Input id="contactFullName" name="contactFullName" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">Email de contacto</Label>
                  <Input id="contactEmail" name="contactEmail" type="email" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone">Teléfono</Label>
                  <Input id="contactPhone" name="contactPhone" placeholder="+549..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">País</Label>
                  <Input id="country" name="country" placeholder="Argentina" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="socialInstagram">Instagram</Label>
                  <Input id="socialInstagram" name="socialInstagram" placeholder="@usuario" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="socialTiktok">TikTok</Label>
                  <Input id="socialTiktok" name="socialTiktok" placeholder="@usuario" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="socialFacebook">Facebook</Label>
                  <Input id="socialFacebook" name="socialFacebook" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="socialYoutube">YouTube</Label>
                  <Input id="socialYoutube" name="socialYoutube" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="socialWebsite">Sitio web</Label>
                <Input id="socialWebsite" name="socialWebsite" placeholder="https://..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-1.5">
                  <Label htmlFor="billingCutoffDay">Día de corte de facturación</Label>
                  <Input
                    id="billingCutoffDay"
                    name="billingCutoffDay"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="Ej: 10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="driveMode">Carpeta de Google Drive</Label>
                <Select
                  name="driveMode"
                  value={driveMode}
                  onValueChange={(v) => setDriveMode(v as "auto" | "linked")}
                >
                  <SelectTrigger className="w-full" id="driveMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Crear carpeta nueva automáticamente</SelectItem>
                    <SelectItem value="linked">Vincular una carpeta ya existente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {driveMode === "linked" && (
                <div className="space-y-1.5">
                  <Label htmlFor="existingDriveFolderId">ID de la carpeta de Drive</Label>
                  <Input
                    id="existingDriveFolderId"
                    name="existingDriveFolderId"
                    placeholder="Se copia de la URL de la carpeta en Drive"
                  />
                  <p className="text-muted-foreground text-xs">
                    Tiene que estar compartida con el email de la cuenta de servicio de
                    Google Drive.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="pt-2">
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
