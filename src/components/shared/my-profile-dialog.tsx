"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  User,
  Palette,
  Bell,
  ShieldCheck,
  Camera,
  Loader2,
  Check,
  Moon,
  Sun,
  Sparkles as SparklesIcon,
  Smartphone,
  ShieldOff,
  KeyRound,
} from "lucide-react";

import {
  updateMyNotificationsAction,
  updateMyPreferencesAction,
  updateMyProfileAction,
} from "@/app/actions/my-profile";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-context";
import { getInitials, cn, formatDate, formatTime } from "@/lib/utils";
import { PHONE_INPUT_PATTERN } from "@/lib/validation";
import type { Profile, ProfileTheme } from "@/types/database";

type SectionKey = "perfil" | "preferencias" | "notificaciones" | "seguridad";

interface MySession {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
  is_current: boolean;
}

/** Bastante tosco a propósito — solo para no mostrar un user-agent crudo de
 *  200 caracteres; no reemplaza una librería real de detección de UA. */
function summarizeUserAgent(ua: string | null): string {
  if (!ua) return "Dispositivo desconocido";
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  let os = "Desconocido";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "Navegador";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  return `${browser} · ${os}${isMobile ? " (móvil)" : ""}`;
}

// Las 4 tarjetas de tema son nombres de producto (estilo MB Suite) — no se
// traducen, se muestran igual en los dos idiomas.
const THEME_CARDS: { value: ProfileTheme; label: string; tagline: string; icon: typeof Moon }[] = [
  { value: "midnight_dark", label: "Midnight Dark", tagline: "Deep & Premium", icon: Moon },
  { value: "modern_mix", label: "Modern Mix", tagline: "Dark chrome, light content", icon: Palette },
  { value: "pure_light", label: "Pure Light", tagline: "Clean & Bright", icon: Sun },
  { value: "psychedelic", label: "Psychedelic", tagline: "Fun & Crazy", icon: SparklesIcon },
];

// Este portal solo tiene dos skins reales (claro/oscuro, vía next-themes) —
// las 4 tarjetas de MB Suite se replican tal cual visualmente, pero cada una
// mapea a la aproximación más cercana disponible hoy.
const THEME_TO_NEXT_THEME: Record<ProfileTheme, string> = {
  midnight_dark: "dark",
  modern_mix: "system",
  pure_light: "light",
  psychedelic: "light",
};

function ProfileTab({ profile }: { profile: Profile }) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(profile.avatar_url);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: pub.publicUrl })
        .eq("id", profile.id);
      if (updateError) throw updateError;

      toast.success(t("components.shared.avatarUpdated", "Foto de perfil actualizada"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("components.shared.avatarUploadError", "No se pudo subir la imagen."));
      setPreview(profile.avatar_url);
    } finally {
      setIsUploading(false);
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateMyProfileAction(formData);
      if (res.ok) {
        toast.success(t("components.shared.profileUpdated", "Perfil actualizado"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">{t("components.shared.sectionProfile", "Perfil de Cuenta")}</h2>
        <p className="text-muted-foreground text-sm">{t("components.shared.profileDesc", "Gestiona tu información personal y seguridad.")}</p>
      </div>

      <div className="flex items-center gap-3 border-b border-border pb-5">
        <button
          type="button"
          className="group relative shrink-0"
          onClick={() => fileInputRef.current?.click()}
          aria-label={t("components.shared.changeAvatarAria", "Cambiar foto de perfil")}
          disabled={isUploading}
        >
          <Avatar className="size-14">
            <AvatarImage src={preview ?? undefined} />
            <AvatarFallback className="text-base">{getInitials(profile.full_name || profile.email)}</AvatarFallback>
          </Avatar>
          <span className="bg-primary text-primary-foreground absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full">
            {isUploading ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" />}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={isUploading}
          />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{profile.full_name || t("pages.equipo.noName", "Sin nombre")}</p>
          <p className="text-muted-foreground truncate text-xs">{profile.email}</p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">{t("components.shared.displayNameLabel", "Nombre (Display Name)")}</Label>
            <Input id="fullName" name="fullName" required defaultValue={profile.full_name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">{t("components.shared.jobTitleLabel", "Cargo / Título")}</Label>
            <Input id="jobTitle" name="jobTitle" placeholder={t("components.shared.jobTitlePlaceholder", "ej. Project Manager")} defaultValue={profile.job_title} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("components.shared.phoneLabel", "Teléfono")}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              pattern={PHONE_INPUT_PATTERN}
              title={t("components.shared.phoneInvalidTitle", "Solo números, espacios, +, - y paréntesis")}
              placeholder="+54 11 ..."
              defaultValue={profile.phone}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">{t("components.shared.locationLabel", "Ubicación")}</Label>
            <Input id="location" name="location" placeholder={t("components.shared.locationPlaceholder", "Ciudad, País")} defaultValue={profile.location} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">{t("components.shared.bioLabel", "Bio / Sobre mí")}</Label>
          <Textarea id="bio" name="bio" rows={3} placeholder={t("components.shared.bioPlaceholder", "Breve descripción...")} defaultValue={profile.bio} />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {t("components.shared.saveChanges", "Guardar cambios")}
        </Button>
      </form>
    </div>
  );
}

function PreferencesTab({ profile }: { profile: Profile }) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [theme, setThemeChoice] = React.useState<ProfileTheme>(profile.theme_preference);
  const { setTheme } = useTheme();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    formData.set("theme", theme);
    startTransition(async () => {
      const res = await updateMyPreferencesAction(formData);
      if (res.ok) {
        setTheme(THEME_TO_NEXT_THEME[theme]);
        toast.success(t("components.shared.preferencesSaved", "Preferencias guardadas"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">{t("settings.title", "Preferencias")}</h2>
        <p className="text-muted-foreground text-sm">{t("components.shared.preferencesDesc", "Personaliza tu experiencia en la plataforma.")}</p>
      </div>

      <form action={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="language">{t("settings.language", "Idioma")}</Label>
          <Select name="language" defaultValue={profile.language}>
            <SelectTrigger id="language" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="numberFormat">{t("components.shared.numberFormatLabel", "Formato de Números")}</Label>
          <Select name="numberFormat" defaultValue={profile.number_format}>
            <SelectTrigger id="numberFormat" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es_latam">{t("components.shared.numberFormatEuLatam", "1.000,00 (Europe/LatAm)")}</SelectItem>
              <SelectItem value="en_us">{t("components.shared.numberFormatUs", "1,000.00 (US)")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("settings.theme", "Tema")}</Label>
          {THEME_CARDS.map((card) => {
            const Icon = card.icon;
            const active = theme === card.value;
            return (
              <button
                key={card.value}
                type="button"
                onClick={() => setThemeChoice(card.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150",
                  active ? "border-primary-strong bg-primary-strong/5" : "border-border hover:bg-accent"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{card.label}</span>
                  <span className="text-muted-foreground block text-xs">{card.tagline}</span>
                </span>
                {active && <Check className="text-primary-strong size-4 shrink-0" />}
              </button>
            );
          })}
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {t("components.shared.saveChanges", "Guardar cambios")}
        </Button>
      </form>
    </div>
  );
}

function NotificationsTab({ profile }: { profile: Profile }) {
  const { t } = useLocale();
  const [marketing, setMarketing] = React.useState(profile.notify_marketing);
  const [productUpdates, setProductUpdates] = React.useState(profile.notify_product_updates);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function persist(nextMarketing: boolean, nextProductUpdates: boolean) {
    startTransition(async () => {
      const res = await updateMyNotificationsAction(nextMarketing, nextProductUpdates);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">{t("components.shared.sectionNotifications", "Notificaciones")}</h2>
        <p className="text-muted-foreground text-sm">{t("components.shared.notificationsDesc", "Gestiona cómo nos comunicamos contigo.")}</p>
      </div>

      <div className="space-y-2">
        <div className="border-border flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium">{t("components.shared.marketingTitle", "Marketing y Ofertas")}</p>
            <p className="text-muted-foreground text-xs">{t("components.shared.marketingDesc", "Tips, tutoriales y promociones especiales.")}</p>
          </div>
          <Switch
            checked={marketing}
            disabled={isPending}
            onCheckedChange={(checked) => {
              setMarketing(checked);
              persist(checked, productUpdates);
            }}
          />
        </div>
        <div className="border-border flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium">{t("components.shared.productUpdatesTitle", "Actualizaciones de Producto")}</p>
            <p className="text-muted-foreground text-xs">{t("components.shared.productUpdatesDesc", "Nuevas funciones, mejoras y changelogs.")}</p>
          </div>
          <Switch
            checked={productUpdates}
            disabled={isPending}
            onCheckedChange={(checked) => {
              setProductUpdates(checked);
              persist(marketing, checked);
            }}
          />
        </div>
        <div className="border-border flex items-center justify-between gap-3 rounded-lg border px-4 py-3 opacity-70">
          <div>
            <p className="text-sm font-medium">{t("components.shared.securityAlertsTitle", "Alertas de Seguridad")}</p>
            <p className="text-muted-foreground text-xs">{t("components.shared.securityAlertsDesc", "Avisos de inicio de sesión y seguridad (Obligatorio).")}</p>
          </div>
          <Switch checked disabled />
        </div>
      </div>
    </div>
  );
}

/**
 * Seguridad — sesiones activas (con "cerrar todas") siempre visible, y
 * verificación en dos pasos SOLO si el admin la prendió en Configuración >
 * Módulos ("verificacion-2fa", apagada por defecto — ver 0036_2fa_module.sql).
 * El flag apagado esconde el botón de ACTIVAR acá, pero nunca desactiva a
 * alguien que ya la tenía andando de antes (eso lo sigue exigiendo Supabase
 * Auth en el login, ver login-form.tsx).
 */
function SecurityTab({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  const router = useRouter();

  const [sessions, setSessions] = React.useState<MySession[] | null>(null);
  const [loadingSessions, setLoadingSessions] = React.useState(true);
  const [signingOutAll, setSigningOutAll] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .rpc("list_my_sessions")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("[list_my_sessions]", error.message);
        setSessions(error ? [] : (data ?? []));
        setLoadingSessions(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOutEverywhere() {
    setSigningOutAll(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      toast.error("No se pudieron cerrar las sesiones.");
      setSigningOutAll(false);
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  const [factor, setFactor] = React.useState<{ id: string; status: string } | null>(null);
  const [loadingFactor, setLoadingFactor] = React.useState(twoFactorEnabled);
  const [enrolling, setEnrolling] = React.useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [mfaCode, setMfaCode] = React.useState("");
  const [mfaBusy, setMfaBusy] = React.useState(false);

  React.useEffect(() => {
    // Si el módulo está apagado, `loadingFactor` ya arrancó en `false` (ver
    // su useState de arriba, inicializado con `twoFactorEnabled`) — nada que
    // pedirle a Supabase acá, así que ni corremos el effect.
    if (!twoFactorEnabled) return;
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data) {
        const totp = data.totp[0] ?? null;
        setFactor(totp ? { id: totp.id, status: totp.status } : null);
      }
      setLoadingFactor(false);
    });
    return () => {
      cancelled = true;
    };
  }, [twoFactorEnabled]);

  async function handleStartEnroll() {
    setMfaBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setMfaBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "No se pudo iniciar la activación.");
      return;
    }
    setEnrolling({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  }

  async function handleConfirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enrolling) return;
    setMfaBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrolling.factorId,
      code: mfaCode.trim(),
    });
    setMfaBusy(false);
    if (error) {
      toast.error("Código incorrecto. Probá de nuevo.");
      return;
    }
    toast.success("Verificación en dos pasos activada.");
    setFactor({ id: enrolling.factorId, status: "verified" });
    setEnrolling(null);
    setMfaCode("");
  }

  async function handleCancelEnroll() {
    if (!enrolling) return;
    const supabase = createClient();
    await supabase.auth.mfa.unenroll({ factorId: enrolling.factorId });
    setEnrolling(null);
    setMfaCode("");
  }

  async function handleDisable() {
    if (!factor) return;
    setMfaBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    setMfaBusy(false);
    if (error) {
      toast.error("No se pudo desactivar.");
      return;
    }
    setFactor(null);
    toast.success("Verificación en dos pasos desactivada.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Seguridad</h2>
        <p className="text-muted-foreground text-sm">Sesiones activas y verificación en dos pasos.</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Sesiones activas</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSignOutEverywhere}
            disabled={signingOutAll || loadingSessions}
          >
            {signingOutAll && <Loader2 className="animate-spin" />}
            Cerrar todas las sesiones
          </Button>
        </div>

        {loadingSessions ? (
          <div className="flex justify-center py-4">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="border-border flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <Smartphone className="text-muted-foreground size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {summarizeUserAgent(s.user_agent)}
                    {s.is_current && <Badge variant="secondary">Este dispositivo</Badge>}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {s.ip ? `${s.ip} · ` : ""}
                    Activo desde {formatDate(s.updated_at)} {formatTime(s.updated_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No se pudo cargar la lista de sesiones.</p>
        )}
      </div>

      {twoFactorEnabled && (
        <div className="space-y-3 border-t border-border pt-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            <h3 className="text-sm font-medium">Verificación en dos pasos</h3>
          </div>

          {loadingFactor ? (
            <div className="flex justify-center py-4">
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            </div>
          ) : enrolling ? (
            <form onSubmit={handleConfirmEnroll} className="border-border space-y-3 rounded-lg border p-4">
              <p className="text-sm">
                Escaneá este código con tu app de autenticación (Google Authenticator, Authy, etc.):
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element -- data: URI de Supabase Auth, no un asset estático */}
              <img src={enrolling.qrCode} alt="Código QR de verificación en dos pasos" className="size-40" />
              <p className="text-muted-foreground text-xs">
                ¿No podés escanear? Ingresá este código a mano:{" "}
                <span className="font-mono">{enrolling.secret}</span>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="enrollCode">Código de 6 dígitos</Label>
                <Input
                  id="enrollCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={mfaBusy}>
                  {mfaBusy && <Loader2 className="animate-spin" />}
                  Confirmar
                </Button>
                <Button type="button" variant="ghost" onClick={handleCancelEnroll} disabled={mfaBusy}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : factor?.status === "verified" ? (
            <div className="border-border flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-primary-strong size-4" />
                <p className="text-sm">Activada para tu cuenta.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleDisable} disabled={mfaBusy}>
                {mfaBusy ? <Loader2 className="animate-spin" /> : <ShieldOff className="size-3.5" />}
                Desactivar
              </Button>
            </div>
          ) : (
            <div className="border-border rounded-lg border border-dashed p-4">
              <p className="text-muted-foreground mb-2 text-sm">
                Sumá un segundo paso al iniciar sesión, con una app de autenticación (Google Authenticator, Authy,
                etc.) — aunque alguien adivine tu contraseña, no va a poder entrar sin el código de tu teléfono.
              </p>
              <Button type="button" size="sm" onClick={handleStartEnroll} disabled={mfaBusy}>
                {mfaBusy ? <Loader2 className="animate-spin" /> : <KeyRound className="size-3.5" />}
                Activar verificación en dos pasos
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MyProfileDialog({
  profile,
  open,
  onOpenChange,
  twoFactorEnabled = false,
}: {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Configuración > Módulos > "Verificación en dos pasos" (apagado por defecto). */
  twoFactorEnabled?: boolean;
}) {
  const { t } = useLocale();
  const [section, setSection] = React.useState<SectionKey>("perfil");

  const SECTIONS: { key: SectionKey; label: string; icon: typeof User }[] = [
    { key: "perfil", label: t("components.shared.sectionProfile", "Perfil de Cuenta"), icon: User },
    { key: "preferencias", label: t("settings.title", "Preferencias"), icon: Palette },
    { key: "notificaciones", label: t("components.shared.sectionNotifications", "Notificaciones"), icon: Bell },
    { key: "seguridad", label: t("components.shared.sectionSecurity", "Seguridad"), icon: ShieldCheck },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:grid sm:grid-cols-[220px_1fr] sm:max-w-3xl">
        <DialogTitle className="sr-only">{t("components.shared.sectionProfile", "Perfil de Cuenta")}</DialogTitle>
        {/*
          Antes esto era SIEMPRE una grilla de 220px + contenido — en mobile
          (~360-400px de ancho real) esos 220px fijos de sidebar dejaban la
          columna de contenido aplastada en menos de 150px, imposible de
          usar. Ese primer intento (franja de tabs horizontal scrolleable
          arriba del contenido) resultó peor: el botón de cerrar (absolute
          top-5 right-5, ver ui/dialog.tsx) flota siempre en esa esquina, y
          quedaba tapando justo la última pestaña ("Notificaciones") cuando
          no entraban las 3 sin scroll.
          Ahora, debajo de "sm", es una barra de navegación fija ABAJO del
          contenido (ícono arriba, label abajo, como un bottom-nav de app),
          con grid-cols-4: las secciones entran siempre completas, nunca
          hace falta scrollear ni hay nada escondido. Al estar abajo, nunca
          compite con el botón de cerrar de arriba. Desde "sm" vuelve a ser
          la grilla sidebar+contenido de siempre (mismo order-none = orden
          natural del DOM, sidebar primero).
        */}
        <div className="bg-muted/40 order-2 grid shrink-0 grid-cols-4 gap-1 rounded-b-3xl border-t border-border p-2 sm:order-none sm:flex sm:flex-col sm:gap-0.5 sm:rounded-b-none sm:rounded-l-3xl sm:border-t-0 sm:border-r sm:p-4">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSection(s.key)}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-[11px] leading-tight transition-colors duration-150 sm:w-full sm:flex-row sm:justify-start sm:gap-2 sm:px-3 sm:text-left sm:text-sm sm:whitespace-nowrap",
                  active ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="max-w-full truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
        <div className="order-1 min-h-0 flex-1 overflow-y-auto p-5 sm:order-none sm:min-h-[auto] sm:max-h-[85vh] sm:p-8">
          {section === "perfil" && <ProfileTab profile={profile} />}
          {section === "preferencias" && <PreferencesTab profile={profile} />}
          {section === "notificaciones" && <NotificationsTab profile={profile} />}
          {section === "seguridad" && <SecurityTab twoFactorEnabled={twoFactorEnabled} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
