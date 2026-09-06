"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, Loader2, Copy, Check, KeyRound, ShieldAlert } from "lucide-react";

import { createEditorAction } from "@/app/actions/editors";
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
import { useLocale } from "@/lib/i18n/locale-context";

type Mode = "direct" | "invite";

interface RevealedCredential {
  email: string;
  temporaryPassword: string;
}

/**
 * Alta de Editor — dos modos (ver `createEditorAction`):
 *  - "direct" (default): la cuenta queda lista al toque con una contraseña
 *    temporal que este mismo diálogo muestra UNA sola vez, para pasarle al
 *    editor por el canal que prefieras. Pensado como default porque el envío
 *    de invitaciones depende del mailer de Supabase, que en este proyecto
 *    todavía no tiene un proveedor SMTP propio configurado.
 *  - "invite": el flujo original — le llega un email para setear su propia
 *    contraseña. Sigue disponible para cuando el envío de emails esté
 *    resuelto.
 * En ambos casos el editor no ve ningún cliente hasta que se lo asignes
 * desde esta misma pantalla.
 */
export function NewEditorDialog() {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("direct");
  const [isPending, startTransition] = useTransition();
  const [revealed, setRevealed] = React.useState<RevealedCredential | null>(null);
  const [copied, setCopied] = React.useState(false);
  const router = useRouter();

  function resetAndClose() {
    setOpen(false);
    setRevealed(null);
    setCopied(false);
    setMode("direct");
  }

  function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    startTransition(async () => {
      const res = await createEditorAction(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      if (res.temporaryPassword) {
        // Alta directa exitosa: no cerramos el diálogo todavía — primero
        // hay que mostrarle la contraseña al admin, porque no se puede
        // volver a consultar después (Supabase la guarda hasheada).
        setRevealed({ email, temporaryPassword: res.temporaryPassword });
        router.refresh();
        return;
      }

      toast.success(
        res.alreadyExisted
          ? t("components.team.editorLinked", "Ya existía una cuenta con ese email — se vinculó como editor.")
          : t("components.team.invitationSent", "Invitación enviada por email.")
      );
      resetAndClose();
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
      toast.error(t("components.team.copyFailed", "No se pudo copiar. Seleccionala manualmente."));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : resetAndClose())}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus /> {t("components.team.inviteEditor", "Nuevo editor")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {revealed ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="text-primary size-4.5" />
                {t("components.team.credentialTitle", "Cuenta creada")}
              </DialogTitle>
              <DialogDescription>
                {t(
                  "components.team.credentialDesc",
                  "Pasásela al editor por un canal seguro (WhatsApp, en persona). No se vuelve a mostrar."
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label>{t("components.team.emailLabel", "Email")}</Label>
              <Input readOnly value={revealed.email} className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("components.team.temporaryPasswordLabel", "Contraseña temporal")}</Label>
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
                "components.team.credentialHint",
                "El editor puede cambiarla cuando quiera desde su propio perfil, una vez que inicie sesión."
              )}
            </p>

            <DialogFooter>
              <Button type="button" onClick={resetAndClose}>
                {t("components.team.done", "Listo")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t("components.team.inviteEditor", "Nuevo editor")}</DialogTitle>
              <DialogDescription>
                {t(
                  "components.team.inviteEditorDesc",
                  "No va a ver ningún cliente hasta que se lo asignes desde acá."
                )}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList className="w-full">
                <TabsTrigger value="direct">
                  {t("components.team.modeDirect", "Crear con contraseña")}
                </TabsTrigger>
                <TabsTrigger value="invite">{t("components.team.modeInvite", "Invitar por email")}</TabsTrigger>
              </TabsList>
              <input type="hidden" name="mode" value={mode} />

              <TabsContent value="direct" className="pt-1">
                <p className="text-muted-foreground text-xs">
                  {t(
                    "components.team.modeDirectHint",
                    "Queda activa al toque. Te muestro una contraseña temporal para pasarle al editor vos mismo."
                  )}
                </p>
              </TabsContent>
              <TabsContent value="invite" className="pt-1">
                <p className="text-muted-foreground text-xs">
                  {t(
                    "components.team.modeInviteHint",
                    "Le llega un email para crear su propia contraseña. Depende de que el envío de emails esté funcionando."
                  )}
                </p>
              </TabsContent>
            </Tabs>

            <div className="space-y-1.5">
              <Label htmlFor="fullName">{t("components.team.fullNameLabel", "Nombre completo")}</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("components.team.emailLabel", "Email")}</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                {mode === "direct"
                  ? t("components.team.createEditor", "Crear editor")
                  : t("components.team.sendInvitation", "Enviar invitación")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
