"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { User, Palette, Bell, Camera, Loader2, Check, Moon, Sun, Sparkles as SparklesIcon } from "lucide-react";

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
import { useLocale } from "@/lib/i18n/locale-context";
import { getInitials, cn } from "@/lib/utils";
import { PHONE_INPUT_PATTERN } from "@/lib/validation";
import type { Profile, ProfileTheme } from "@/types/database";

type SectionKey = "perfil" | "preferencias" | "notificaciones";

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

export function MyProfileDialog({
  profile,
  open,
  onOpenChange,
}: {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLocale();
  const [section, setSection] = React.useState<SectionKey>("perfil");

  const SECTIONS: { key: SectionKey; label: string; icon: typeof User }[] = [
    { key: "perfil", label: t("components.shared.sectionProfile", "Perfil de Cuenta"), icon: User },
    { key: "preferencias", label: t("settings.title", "Preferencias"), icon: Palette },
    { key: "notificaciones", label: t("components.shared.sectionNotifications", "Notificaciones"), icon: Bell },
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
          con grid-cols-3: las 3 secciones entran siempre completas, nunca
          hace falta scrollear ni hay nada escondido. Al estar abajo, nunca
          compite con el botón de cerrar de arriba. Desde "sm" vuelve a ser
          la grilla sidebar+contenido de siempre (mismo order-none = orden
          natural del DOM, sidebar primero).
        */}
        <div className="bg-muted/40 order-2 grid shrink-0 grid-cols-3 gap-1 rounded-b-3xl border-t border-border p-2 sm:order-none sm:flex sm:flex-col sm:gap-0.5 sm:rounded-b-none sm:rounded-l-3xl sm:border-t-0 sm:border-r sm:p-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
