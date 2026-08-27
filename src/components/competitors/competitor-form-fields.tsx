"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/locale-context";
import type { CompetitorWithClient } from "@/lib/queries/competitors";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

export function CompetitorFormFields({
  competitor,
  clients,
}: {
  competitor?: CompetitorWithClient;
  clients: { id: string; name: string }[];
}) {
  const { t } = useLocale();

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("components.competitors.nameLabel", "Nombre")}</Label>
        <Input id="name" name="name" required defaultValue={competitor?.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="platform">{t("components.competitors.platformLabel", "Plataforma")}</Label>
          <Select name="platform" defaultValue={competitor?.platform ?? "instagram"}>
            <SelectTrigger id="platform" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PLATFORM_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="handle">{t("components.competitors.handleLabel", "Usuario / handle")}</Label>
          <Input
            id="handle"
            name="handle"
            placeholder={t("components.competitors.handlePlaceholder", "@marca")}
            defaultValue={competitor?.handle ?? ""}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="followersCount">{t("components.competitors.followersLabel", "Seguidores")}</Label>
          <Input
            id="followersCount"
            name="followersCount"
            type="number"
            min={0}
            defaultValue={competitor?.followers_count ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="engagementRate">{t("components.competitors.engagementLabel", "Engagement (%)")}</Label>
          <Input
            id="engagementRate"
            name="engagementRate"
            type="number"
            min={0}
            max={100}
            step="0.01"
            defaultValue={competitor?.engagement_rate ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="clientId">
          {t("components.competitors.compareAccountLabel", "Cuenta a la que se compara (opcional)")}
        </Label>
        <Select name="clientId" defaultValue={competitor?.client_id ?? "none"}>
          <SelectTrigger id="clientId" className="w-full">
            <SelectValue placeholder={t("components.competitors.general", "General")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("components.competitors.general", "General")}</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">{t("components.competitors.notesLabel", "Notas")}</Label>
        <Input id="notes" name="notes" defaultValue={competitor?.notes ?? ""} />
      </div>
    </>
  );
}
