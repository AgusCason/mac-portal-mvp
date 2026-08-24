"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Settings, Sun, Moon, Laptop, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

const THEME_OPTIONS = [
  {
    value: "light",
    label: "Claro",
    tagline: "Simple y luminoso",
    icon: Sun,
    swatch: "bg-white border border-neutral-200",
  },
  {
    value: "dark",
    label: "Oscuro",
    tagline: "Cómodo para trabajar de noche",
    icon: Moon,
    swatch: "bg-neutral-900",
  },
  {
    value: "system",
    label: "Sistema",
    tagline: "Sigue la configuración de tu dispositivo",
    icon: Laptop,
    swatch: "bg-gradient-to-br from-white to-neutral-900",
  },
] as const;

/**
 * Panel deslizante "Settings" — preferencias globales del usuario (hoy: solo
 * tema de la interfaz, con nombre + descripción por opción al estilo del
 * selector de temas de MB Suite). Reemplaza al ModeToggle suelto del header.
 */
export function SettingsPanel() {
  const { theme, setTheme } = useTheme();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Preferencias">
          <Settings />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Preferencias de tu cuenta en este dispositivo.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <div>
            <p className="mb-2 text-sm font-medium">Tema</p>
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
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    <span className={cn("size-8 shrink-0 rounded-md", opt.swatch)} />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Icon className="size-3.5" /> {opt.label}
                      </span>
                      <span className="text-muted-foreground block text-xs">{opt.tagline}</span>
                    </span>
                    {active && <Check className="text-primary size-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
