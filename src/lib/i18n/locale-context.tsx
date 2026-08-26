"use client";

import * as React from "react";
import { translate, resolveLocale, type Locale } from "@/lib/i18n/dictionary";

interface LocaleContextValue {
  locale: Locale;
  /** Solo cambia el estado en memoria — quien la llama decide si además persiste en `profiles.language`. */
  setLocale: (locale: Locale) => void;
  t: (path: string, fallback?: string) => string;
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

/**
 * Envuelve el AppShell. Arranca con el idioma guardado en el profile
 * (`resolveLocale(profile.language)`, español si no hay nada o es `pt`) y
 * permite cambiarlo en memoria al toque desde `SettingsPanel` — la
 * persistencia real a `profiles.language` la hace la Server Action
 * (`updateMyLanguageAction`), esto solo evita esperar un round-trip para
 * que el sidebar/topbar reaccionen.
 */
export function LocaleProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: string;
  children: React.ReactNode;
}) {
  const [locale, setLocale] = React.useState<Locale>(() => resolveLocale(initialLanguage));

  const t = React.useCallback((path: string, fallback?: string) => translate(locale, path, fallback), [locale]);
  const value = React.useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale() tiene que usarse dentro de <LocaleProvider>.");
  return ctx;
}
