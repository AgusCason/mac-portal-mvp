"use client";

import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

/**
 * Input de usuario/handle de red social con el "@" fijo como prefijo visual
 * — el admin solo escribe el nombre de usuario, nunca el "@". El valor que
 * viaja en el form NO incluye el "@" (se normaliza server-side, ver
 * `withHandlePrefix` en app/actions/clients.ts), para no depender de JS para
 * que el dato quede bien guardado.
 */
export function HandleInput({
  id,
  name,
  defaultValue,
  placeholder,
  className,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="relative">
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
        @
      </span>
      <Input
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder ?? t("components.shared.usernamePlaceholder", "usuario")}
        className={cn("pl-6", className)}
      />
    </div>
  );
}
