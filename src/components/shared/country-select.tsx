"use client";

import { COUNTRIES } from "@/lib/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Selector de país con bandera — 247 países (src/lib/countries.ts), buscables
 * por teclado (typeahead nativo de Radix Select). Controlado por ISO2 (ej.
 * "AR"), no por el nombre — quien lo use decide qué hacer con la selección
 * (ej. NewClientDialog lo usa además para autocompletar el código de país
 * del teléfono, y guarda el nombre en español en un input oculto aparte).
 */
export function CountrySelect({
  id,
  value,
  onValueChange,
  placeholder,
  className,
}: {
  id?: string;
  value: string | undefined;
  onValueChange: (iso2: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className={className ?? "w-full"}>
        <SelectValue placeholder={placeholder ?? t("components.shared.chooseCountryPlaceholder", "Seleccioná un país")} />
      </SelectTrigger>
      <SelectContent>
        {COUNTRIES.map((c) => (
          <SelectItem key={c.iso2} value={c.iso2}>
            <span className="mr-1">{c.flag}</span> {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
