"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/locale-context";
import type { ContentIdeaWithClient } from "@/lib/queries/content-ideas";

export const IDEA_TYPE_KEYS: { value: string; labelKey: string; fallback: string }[] = [
  { value: "serie_social", labelKey: "components.contentStudio.typeSerieSocial", fallback: "Serie Social" },
  { value: "sesion_fotos", labelKey: "components.contentStudio.typeSesionFotos", fallback: "Sesión de Fotos" },
  { value: "video_script", labelKey: "components.contentStudio.typeVideoScript", fallback: "Video Script" },
  { value: "caption", labelKey: "components.contentStudio.typeCaption", fallback: "Caption" },
  { value: "content_bank", labelKey: "components.contentStudio.typeContentBank", fallback: "Content Bank" },
];

export function IdeaFormFields({
  idea,
  clients,
  defaultType,
}: {
  idea?: ContentIdeaWithClient;
  clients: { id: string; name: string }[];
  defaultType?: string;
}) {
  const { t } = useLocale();

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="type">{t("components.contentStudio.typeLabel", "Tipo")}</Label>
        <Select name="type" defaultValue={idea?.type ?? defaultType ?? "content_bank"}>
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IDEA_TYPE_KEYS.map(({ value, labelKey, fallback }) => (
              <SelectItem key={value} value={value}>
                {t(labelKey, fallback)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="title">{t("components.contentStudio.titleLabel", "Título")}</Label>
        <Input id="title" name="title" required defaultValue={idea?.title} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body">{t("components.contentStudio.contentLabel", "Contenido")}</Label>
        <Textarea id="body" name="body" rows={6} defaultValue={idea?.body} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="clientId">{t("components.contentStudio.accountOptionalLabel", "Cuenta (opcional)")}</Label>
        <Select name="clientId" defaultValue={idea?.client_id ?? "none"}>
          <SelectTrigger id="clientId" className="w-full">
            <SelectValue placeholder={t("components.contentStudio.noAccount", "Sin cuenta")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("components.contentStudio.noAccount", "Sin cuenta")}</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
