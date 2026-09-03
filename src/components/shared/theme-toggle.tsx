"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Toggle claro/oscuro compacto del topbar — mismo patrón que `.theme-toggle`
 * del mockup de dashboard aprobado (píldora con 2 círculos, el activo en
 * foreground sólido). El picker completo de temas (con la opción "Sistema")
 * sigue viviendo en `SettingsPanel`; esto es solo el atajo rápido de 2
 * estados para el caso común.
 *
 * Deliberadamente NO lee `resolvedTheme` de `next-themes` para decidir qué
 * círculo pintar activo — eso solo se resuelve en cliente (localStorage),
 * así que necesitaría el típico patrón `mounted` vía `useEffect(() =>
 * setState(true))`, que dispara la regla `react-hooks/set-state-in-effect`
 * (cascading render) del lint de este repo. En vez de eso, el estado activo
 * sale 100% de CSS con la variante `dark:` de Tailwind — como el script
 * inline de `next-themes` ya deja la clase `.dark` puesta en `<html>` ANTES
 * del primer paint, no hay mismatch de hidratación ni flash que evitar.
 */
export function ThemeToggle() {
  const { setTheme } = useTheme();
  const { t } = useLocale();

  return (
    <div className="bg-accent/60 border-border inline-flex items-center gap-0.5 rounded-full border p-0.5">
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-label={t("settings.themeOptions.light.label", "Claro")}
        className="bg-foreground text-background dark:bg-transparent dark:text-muted-foreground dark:hover:text-foreground flex size-7 items-center justify-center rounded-full transition-colors duration-150"
      >
        <Sun className="size-3.5" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-label={t("settings.themeOptions.dark.label", "Oscuro")}
        className="text-muted-foreground hover:text-foreground dark:bg-foreground dark:text-background dark:hover:text-background flex size-7 items-center justify-center rounded-full transition-colors duration-150"
      >
        <Moon className="size-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
