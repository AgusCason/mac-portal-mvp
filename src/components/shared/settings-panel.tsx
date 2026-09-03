"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Settings, Sun, Moon, Laptop, Check, Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLocale } from "@/lib/i18n/locale-context";
import { updateMyLanguageAction } from "@/app/actions/my-profile";
import type { Locale } from "@/lib/i18n/dictionary";

const THEME_OPTIONS = [
  {
    value: "light",
    labelKey: "settings.themeOptions.light.label",
    label: "Claro",
    taglineKey: "settings.themeOptions.light.tagline",
    tagline: "Simple y luminoso",
    icon: Sun,
    swatch: "bg-white border border-neutral-200",
  },
  {
    value: "dark",
    labelKey: "settings.themeOptions.dark.label",
    label: "Oscuro",
    taglineKey: "settings.themeOptions.dark.tagline",
    tagline: "Cómodo para trabajar de noche",
    icon: Moon,
    swatch: "bg-neutral-900",
  },
  {
    value: "system",
    labelKey: "settings.themeOptions.system.label",
    label: "Sistema",
    taglineKey: "settings.themeOptions.system.tagline",
    tagline: "Sigue la configuración de tu dispositivo",
    icon: Laptop,
    swatch: "bg-gradient-to-br from-white to-neutral-900",
  },
] as const;

const LANGUAGE_OPTIONS = [
  {
    value: "es" as const,
    labelKey: "settings.languageOptions.es.label",
    label: "Español (Argentina)",
    taglineKey: "settings.languageOptions.es.tagline",
    tagline: "Predeterminado",
  },
  {
    value: "en" as const,
    labelKey: "settings.languageOptions.en.label",
    label: "English",
    taglineKey: "settings.languageOptions.en.tagline",
    tagline: "Switches menus and titles to English",
  },
];

/**
 * Panel deslizante "Settings" — preferencias globales del usuario: tema de la
 * interfaz e idioma (Español Argentina / English), con nombre + descripción
 * por opción al estilo del selector de temas de MB Suite. El cambio de idioma
 * es inmediato en memoria (`useLocale().setLocale`, para que sidebar/topbar
 * reaccionen sin esperar), y se persiste en `profiles.language` vía
 * `updateMyLanguageAction` + `router.refresh()` para que lo ya renderizado en
 * el servidor (títulos de página, etc.) también se actualice.
 */
export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function handleLanguageChange(next: Locale) {
    if (next === locale) return;
    setLocale(next);
    startTransition(async () => {
      await updateMyLanguageAction(next);
      router.refresh();
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="circle-chip" aria-label={t("settings.title", "Preferencias")}>
          <Settings />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("settings.title", "Preferencias")}</SheetTitle>
          <SheetDescription>
            {t("settings.description", "Personalizá tu experiencia en la plataforma.")}
          </SheetDescription>
        </SheetHeader>
        {/* <ScrollAreaPrimitive.Root> de Radix fija position:relative por
            INLINE style, así que una clase "absolute" en la propia
            ScrollArea nunca gana esa pulseada (sigue relative). El wrapper
            PLANO de acá abajo sí puede ser absolute inset-0 — con top/bottom
            en 0 su alto queda definido explícitamente, y la ScrollArea
            adentro (h-full) y su viewport interno (height:100%) resuelven en
            cascada. Ver new-client-dialog.tsx para el diagnóstico completo. */}
        <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
        <ScrollArea className="h-full">
        <div className="flex flex-col gap-4 px-6 pb-6">
          <div>
            <p className="mb-2 text-sm font-medium">{t("settings.theme", "Tema")}</p>
            <div className="flex flex-col gap-2">
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150",
                      active
                        ? "border-primary-strong bg-primary-strong/5"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    <span className={cn("size-8 shrink-0 rounded-md", opt.swatch)} />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Icon className="size-3.5" /> {t(opt.labelKey, opt.label)}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {t(opt.taglineKey, opt.tagline)}
                      </span>
                    </span>
                    {active && <Check className="text-primary-strong size-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("settings.language", "Idioma")}</p>
            <div className="flex flex-col gap-2">
              {LANGUAGE_OPTIONS.map((opt) => {
                const active = locale === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={pending}
                    onClick={() => handleLanguageChange(opt.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 disabled:opacity-60",
                      active
                        ? "border-primary-strong bg-primary-strong/5"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
                      <Languages className="size-3.5" />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        {t(opt.labelKey, opt.label)}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {t(opt.taglineKey, opt.tagline)}
                      </span>
                    </span>
                    {active && <Check className="text-primary-strong size-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        </ScrollArea>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
