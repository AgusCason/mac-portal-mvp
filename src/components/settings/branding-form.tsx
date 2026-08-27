"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { updateBrandingAction } from "@/app/actions/branding";
import type { AgencyBranding } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/locale-context";

/** Selector de color: swatch nativo + input de texto, sincronizados. */
function ColorField({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
}) {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="border-input h-9 w-10 shrink-0 rounded-md border p-1"
          aria-label={label}
        />
        <Input
          id={id}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="font-mono"
          maxLength={7}
        />
      </div>
    </div>
  );
}

export function BrandingForm({ branding }: { branding: AgencyBranding }) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateBrandingAction(formData);
      if (res.ok) {
        toast.success(t("components.branding.brandingUpdated", "Branding actualizado"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="appName">{t("components.branding.appNameLabel", "Nombre de la app")}</Label>
          <Input id="appName" name="appName" defaultValue={branding.app_name} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="buttonShape">{t("components.branding.buttonShapeLabel", "Forma de botones")}</Label>
          <Select name="buttonShape" defaultValue={branding.button_shape}>
            <SelectTrigger className="w-full" id="buttonShape">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="square">{t("components.branding.shapeSquare", "Cuadrada")}</SelectItem>
              <SelectItem value="rounded">{t("components.branding.shapeRounded", "Redondeada")}</SelectItem>
              <SelectItem value="pill">{t("components.branding.shapePill", "Píldora")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField
          id="primaryColor"
          name="primaryColor"
          label={t("components.branding.primaryColorLabel", "Color primario")}
          defaultValue={branding.primary_color}
        />
        <ColorField
          id="accentColor"
          name="accentColor"
          label={t("components.branding.accentColorLabel", "Color de acento")}
          defaultValue={branding.accent_color}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="logoLightUrl">{t("components.branding.logoLightLabel", "Logo (fondo claro)")}</Label>
          <Input
            id="logoLightUrl"
            name="logoLightUrl"
            type="url"
            placeholder="https://…/logo-light.png"
            defaultValue={branding.logo_light_url ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="logoDarkUrl">{t("components.branding.logoDarkLabel", "Logo (fondo oscuro)")}</Label>
          <Input
            id="logoDarkUrl"
            name="logoDarkUrl"
            type="url"
            placeholder="https://…/logo-dark.png"
            defaultValue={branding.logo_dark_url ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="faviconUrl">{t("components.branding.faviconLabel", "Favicon")}</Label>
        <Input
          id="faviconUrl"
          name="faviconUrl"
          type="url"
          placeholder="https://…/favicon.png"
          defaultValue={branding.favicon_url ?? ""}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        {t(
          "components.branding.typographyNote",
          "Tipografía y estilo de botón (relleno/contorno) quedan guardados para más adelante — hoy solo se aplican de verdad el nombre, los logos, los colores y la forma de los botones."
        )}
      </p>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {isPending ? t("components.branding.saving", "Guardando…") : t("components.branding.saveChanges", "Guardar cambios")}
        </Button>
      </div>
    </form>
  );
}
