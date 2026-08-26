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
import { CountrySelect } from "@/components/shared/country-select";
import { HandleInput } from "@/components/shared/handle-input";
import { COUNTRIES } from "@/lib/countries";
import type { Plan } from "@/types/database";
import type { ContactWithClient } from "@/lib/queries/contacts";

/**
 * Ante un país nuevo, reemplaza (o agrega) el código de país al inicio del
 * teléfono sin pisar un número que el admin ya venía escribiendo:
 * - vacío -> lo completa con "+54 " (ej.) para que solo falte el resto.
 * - ya tenía un código (+...) -> lo reemplaza por el del país nuevo.
 * - ya tenía un número sin código -> lo deja como está (no lo rompe).
 */
function withCountryDialCode(phone: string, dial: string): string {
  const trimmed = phone.trim();
  if (trimmed === "") return `${dial} `;
  const match = trimmed.match(/^\+\d+\s*/);
  if (match) return `${dial} ${trimmed.slice(match[0].length)}`;
  return phone;
}

export function NewClientDialog({
  plans,
  contacts,
  initialContactId,
}: {
  plans: Plan[];
  contacts: ContactWithClient[];
  initialContactId?: string;
}) {
  const initialContact = React.useMemo(
    () => (initialContactId ? contacts.find((c) => c.id === initialContactId) : undefined),
    [contacts, initialContactId]
  );

  const [open, setOpen] = React.useState(() => Boolean(initialContact));
  const [isPending, startTransition] = useTransition();
  const [driveMode, setDriveMode] = React.useState<"auto" | "linked">("auto");
  const [countryIso, setCountryIso] = React.useState<string | undefined>(undefined);
  const [contactFullName, setContactFullName] = React.useState(initialContact?.name ?? "");
  const [contactEmail, setContactEmail] = React.useState(initialContact?.email ?? "");
  const [contactPhone, setContactPhone] = React.useState(initialContact?.phone ?? "");
  const [selectedContactId, setSelectedContactId] = React.useState(initialContactId ?? "none");
  const router = useRouter();

  const selectedCountryName = countryIso
    ? (COUNTRIES.find((c) => c.iso2 === countryIso)?.name ?? "")
    : "";

  function handleContactSelect(contactId: string) {
    setSelectedContactId(contactId);
    if (contactId === "none") return;
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;
    setContactFullName(contact.name);
    if (contact.email) setContactEmail(contact.email);
    if (contact.phone) setContactPhone(contact.phone);
  }

  function handleCountryChange(iso2: string) {
    setCountryIso(iso2);
    const country = COUNTRIES.find((c) => c.iso2 === iso2);
    if (country) setContactPhone((prev) => withCountryDialCode(prev, country.dial));
  }

  function resetForm() {
    setDriveMode("auto");
    setCountryIso(undefined);
    setContactFullName("");
    setContactEmail("");
    setContactPhone("");
    setSelectedContactId("none");
  }

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
        resetForm();
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
              {contacts.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="fromContact">Autocompletar desde un contacto (opcional)</Label>
                  <Select value={selectedContactId} onValueChange={handleContactSelect}>
                    <SelectTrigger id="fromContact" className="w-full">
                      <SelectValue placeholder="Cargar datos manualmente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Cargar datos manualmente</SelectItem>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                          {c.email ? ` (${c.email})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                  <Input
                    id="contactFullName"
                    name="contactFullName"
                    required
                    value={contactFullName}
                    onChange={(e) => setContactFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">Email de contacto</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="country">País</Label>
                  <CountrySelect id="country" value={countryIso} onValueChange={handleCountryChange} />
                  <input type="hidden" name="country" value={selectedCountryName} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone">Teléfono</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    placeholder="+549..."
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="socialInstagram">Instagram</Label>
                  <HandleInput id="socialInstagram" name="socialInstagram" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="socialTiktok">TikTok</Label>
                  <HandleInput id="socialTiktok" name="socialTiktok" />
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
