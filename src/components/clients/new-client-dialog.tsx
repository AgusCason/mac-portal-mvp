"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Copy, Check, KeyRound, ShieldAlert } from "lucide-react";

import { createClientAction } from "@/app/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { PHONE_INPUT_PATTERN } from "@/lib/validation";
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
  const [mode, setMode] = React.useState<"direct" | "invite">("direct");
  const [driveMode, setDriveMode] = React.useState<"auto" | "linked">("auto");
  const [countryIso, setCountryIso] = React.useState<string | undefined>(undefined);
  const [contactFullName, setContactFullName] = React.useState(initialContact?.name ?? "");
  const [contactEmail, setContactEmail] = React.useState(initialContact?.email ?? "");
  const [contactPhone, setContactPhone] = React.useState(initialContact?.phone ?? "");
  const [selectedContactId, setSelectedContactId] = React.useState(initialContactId ?? "none");
  const [revealed, setRevealed] = React.useState<{ email: string; temporaryPassword: string } | null>(null);
  const [copied, setCopied] = React.useState(false);
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
    setMode("direct");
    setDriveMode("auto");
    setCountryIso(undefined);
    setContactFullName("");
    setContactEmail("");
    setContactPhone("");
    setSelectedContactId("none");
    setRevealed(null);
    setCopied(false);
  }

  function handleOpenChange(next: boolean) {
    // Si se cierra mientras se estaba mostrando la contraseña temporal, no
    // la dejamos "pegada" para la próxima apertura — vuelve a arrancar en
    // el formulario.
    if (!next) resetForm();
    setOpen(next);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createClientAction(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      if (res.temporaryPassword) {
        // Alta directa exitosa: mostramos la contraseña antes de cerrar —
        // no se puede volver a consultar después. Mismo criterio que
        // NewEditorDialog.
        setRevealed({ email: res.invitedEmail, temporaryPassword: res.temporaryPassword });
        router.refresh();
        return;
      }

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
    });
  }

  async function handleCopy() {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("components.clients.copyFailed", "No se pudo copiar. Seleccionala manualmente."));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> {t("components.clients.newClient", "Nuevo cliente")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className={revealed ? undefined : "flex h-[85vh] max-h-[85vh] flex-col overflow-hidden"}
      >
        {revealed ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="text-primary size-4.5" />
                {t("components.clients.credentialTitle", "Cliente creado")}
              </DialogTitle>
              <DialogDescription>
                {t(
                  "components.clients.credentialDesc",
                  "Pasásela al contacto por un canal seguro (WhatsApp, en persona). No se vuelve a mostrar."
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label>{t("components.clients.contactEmailLabel", "Email de contacto")}</Label>
              <Input readOnly value={revealed.email} className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("components.clients.temporaryPasswordLabel", "Contraseña temporal")}</Label>
              <div className="flex gap-2">
                <Input readOnly value={revealed.temporaryPassword} className="font-mono text-sm tracking-wide" />
                <Button type="button" variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check className="text-primary" /> : <Copy />}
                </Button>
              </div>
            </div>

            <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
              {t(
                "components.clients.credentialHint",
                "El contacto puede cambiarla cuando quiera desde su propio perfil, una vez que inicie sesión. Las carpetas de Drive se están creando en paralelo."
              )}
            </p>

            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                {t("components.clients.done", "Listo")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
        <>
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

          IMPORTANTE: es "h-[85vh]" (alto explícito), no solo "max-h-[85vh]".
          Con solo max-height, cuando el contenido interno queda afuera del
          flujo (ver ScrollArea de abajo), el diálogo se encoge al alto de lo
          que sí sigue en flujo (header+footer) en vez de ocupar el 85vh, y
          entonces el flex-1 del medio no tiene sobrante que repartir (queda
          en 0 y el formulario se ve "sin contenido"). Con alto explícito el
          diálogo siempre mide 85vh y el flex-1 sí tiene ese espacio real.
        */}
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{t("components.clients.newClient", "Nuevo cliente")}</DialogTitle>
            <DialogDescription>
              {t(
                "components.clients.newClientDesc",
                "Se crea su estructura de carpetas en Google Drive (Crudos, En Edición, Entregables Finales) automáticamente."
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "direct" | "invite")}>
            <TabsList className="w-full">
              <TabsTrigger value="direct">{t("components.clients.modeDirect", "Crear con contraseña")}</TabsTrigger>
              <TabsTrigger value="invite">{t("components.clients.modeInvite", "Invitar por email")}</TabsTrigger>
            </TabsList>
            <input type="hidden" name="mode" value={mode} />

            <TabsContent value="direct" className="pt-1">
              <p className="text-muted-foreground text-xs">
                {t(
                  "components.clients.modeDirectHintClient",
                  "Su portal queda activo al toque. Te muestro una contraseña temporal para pasarle al contacto vos mismo."
                )}
              </p>
            </TabsContent>
            <TabsContent value="invite" className="pt-1">
              <p className="text-muted-foreground text-xs">
                {t(
                  "components.clients.modeInviteHintClient",
                  "Le llega un email para crear su propia contraseña. Depende de que el envío de emails esté funcionando."
                )}
              </p>
            </TabsContent>
          </Tabs>

          {/*
            <ScrollAreaPrimitive.Root> de Radix fija position:relative por
            INLINE style (no por clase), así que una clase "absolute" en la
            propia ScrollArea nunca gana esa pulseada — sigue relative y su
            altura queda "auto" (no definida) dentro de un padre flex-1, y
            entonces el <div data-slot="scroll-area-viewport"> (height:100%
            interno de Radix) no tiene contra qué resolver ese 100% y crece
            al alto de su contenido en vez de quedar acotado (no scrollea, el
            footer queda superpuesto con contenido sin cortar).
            Solución: un div PLANO (no de Radix) es el que va absolute
            inset-0 — eso sí puede tener position:absolute, y al fijar
            top/bottom en 0 su alto queda definido explícitamente (no auto),
            así que la ScrollArea adentro (con h-full) y su Viewport interno
            (height:100%) sí resuelven en cascada.
          */}
          <div className="relative min-h-0 flex-1">
            <div className="absolute inset-0">
              <ScrollArea className="h-full pr-4">
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
                    type="tel"
                    inputMode="tel"
                    pattern={PHONE_INPUT_PATTERN}
                    title={t("components.clients.phoneInvalidTitle", "Solo números, espacios, +, - y paréntesis")}
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
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {mode === "direct"
                ? t("components.clients.createClient", "Crear cliente")
                : t("components.clients.sendInvitation", "Enviar invitación")}
            </Button>
          </DialogFooter>
        </form>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
