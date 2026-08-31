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
import { useLocale } from "@/lib/i18n/locale-context";
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
  const { t } = useLocale();
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
            ? t(
                "components.clients.alreadyExistedToast",
                "Cliente creado — ya existía una cuenta con ese email, se vinculó."
              )
            : t(
                "components.clients.createdToast",
                "Cliente creado — le llegó el email de invitación y las carpetas de Drive en camino."
              )
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
          <Plus /> {t("components.clients.newClient", "Nuevo cliente")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[85vh] flex-col overflow-hidden"
      >
        {/*
          Antes: DialogContent (overflow-y-auto) + este form (max-h-[80vh]) +
          la ScrollArea de abajo (max-h-[55vh]) eran TRES alturas adivinadas
          por separado — apenas header+footer+contenido superaban cualquiera
          de esas cotas, tanto el diálogo como la ScrollArea scrolleaban a la
          vez (el doble scrollbar reportado). Ahora el diálogo nunca scrollea
          (overflow-hidden arriba): el form es flex-1 y la ScrollArea de abajo
          también, así el layout reparte la altura exacta entre
          header/footer/contenido y un solo scroll (el de la ScrollArea) se
          lleva el sobrante.
        */}
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{t("components.clients.newClient", "Nuevo cliente")}</DialogTitle>
            <DialogDescription>
              {t(
                "components.clients.newClientDesc",
                "Se le envía una invitación real por email para acceder a su portal, y se crea su estructura de carpetas en Google Drive (Crudos, En Edición, Entregables Finales) automáticamente."
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1 pr-4">
            <div className="space-y-4 py-2">
              {contacts.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="fromContact">
                    {t("components.clients.autofillFromContact", "Autocompletar desde un contacto (opcional)")}
                  </Label>
                  <Select value={selectedContactId} onValueChange={handleContactSelect}>
                    <SelectTrigger id="fromContact" className="w-full">
                      <SelectValue placeholder={t("components.clients.manualEntry", "Cargar datos manualmente")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("components.clients.manualEntry", "Cargar datos manualmente")}</SelectItem>
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
                <Label htmlFor="name">{t("components.clients.nameLabel", "Nombre / razón social")}</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder={t("components.clients.namePlaceholder", "Ej: Estudio Fit SRL")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brandName">{t("components.clients.brandNameLabel", "Nombre de marca")}</Label>
                <Input
                  id="brandName"
                  name="brandName"
                  placeholder={t("components.clients.brandNamePlaceholder", "Ej: Estudio Fit")}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contactFullName">
                    {t("components.clients.contactFullNameLabel", "Nombre y apellido del contacto")}
                  </Label>
                  <Input
                    id="contactFullName"
                    name="contactFullName"
                    required
                    value={contactFullName}
                    onChange={(e) => setContactFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">{t("components.clients.contactEmailLabel", "Email de contacto")}</Label>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="country">{t("components.clients.countryLabel", "País")}</Label>
                  <CountrySelect id="country" value={countryIso} onValueChange={handleCountryChange} />
                  <input type="hidden" name="country" value={selectedCountryName} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone">{t("components.clients.phoneLabel", "Teléfono")}</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    placeholder={t("components.clients.phonePlaceholder", "+549...")}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="socialInstagram">Instagram</Label>
                  <HandleInput id="socialInstagram" name="socialInstagram" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="socialTiktok">TikTok</Label>
                  <HandleInput id="socialTiktok" name="socialTiktok" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <Label htmlFor="socialWebsite">{t("components.clients.websiteLabel", "Sitio web")}</Label>
                <Input id="socialWebsite" name="socialWebsite" placeholder="https://..." />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="planId">{t("components.clients.planLabel", "Plan (opcional)")}</Label>
                  <Select name="planId">
                    <SelectTrigger className="w-full" id="planId">
                      <SelectValue placeholder={t("components.clients.planPlaceholder", "Sin plan asignado")} />
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
                  <Label htmlFor="billingCutoffDay">
                    {t("components.clients.billingCutoffDayLabel", "Día de corte de facturación")}
                  </Label>
                  <Input
                    id="billingCutoffDay"
                    name="billingCutoffDay"
                    type="number"
                    min={1}
                    max={31}
                    placeholder={t("components.clients.billingCutoffDayPlaceholder", "Ej: 10")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="driveMode">{t("components.clients.driveFolderLabel", "Carpeta de Google Drive")}</Label>
                <Select
                  name="driveMode"
                  value={driveMode}
                  onValueChange={(v) => setDriveMode(v as "auto" | "linked")}
                >
                  <SelectTrigger className="w-full" id="driveMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      {t("components.clients.driveModeAutoOption", "Crear carpeta nueva automáticamente")}
                    </SelectItem>
                    <SelectItem value="linked">
                      {t("components.clients.driveModeLinkedOption", "Vincular una carpeta ya existente")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {driveMode === "linked" && (
                <div className="space-y-1.5">
                  <Label htmlFor="existingDriveFolderId">
                    {t("components.clients.driveFolderIdLabel", "ID de la carpeta de Drive")}
                  </Label>
                  <Input
                    id="existingDriveFolderId"
                    name="existingDriveFolderId"
                    placeholder={t(
                      "components.clients.driveFolderIdPlaceholder",
                      "Se copia de la URL de la carpeta en Drive"
                    )}
                  />
                  <p className="text-muted-foreground text-xs">
                    {t(
                      "components.clients.driveFolderIdHelp",
                      "Tiene que estar compartida con el email de la cuenta de servicio de Google Drive."
                    )}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("components.clients.createClient", "Crear cliente")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
