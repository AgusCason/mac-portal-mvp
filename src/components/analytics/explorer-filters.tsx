"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Barra de filtros de Analytics > Explorer — cliente/plataforma/ventana de
 * días, sincronizada con la URL (?cliente=&plataforma=&dias=) igual que
 * <ReportFilters />, así los accesos directos de Analytics > Dashboards
 * pueden linkear acá con filtros ya aplicados.
 */
export function ExplorerFilters({ clients }: { clients: { id: string; name: string }[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentClient = searchParams.get("cliente") ?? "all";
  const currentPlatform = searchParams.get("plataforma") ?? "all";
  const currentDays = searchParams.get("dias") ?? "30";

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "all") params.delete(name);
    else params.set(name, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = currentClient !== "all" || currentPlatform !== "all" || currentDays !== "30";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={currentClient} onValueChange={(v) => setParam("cliente", v)}>
        <SelectTrigger className="w-44" size="sm">
          <SelectValue placeholder={t("components.analytics.clientFilterPlaceholder", "Cliente")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("components.analytics.allAccounts", "Todas las cuentas")}</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentPlatform} onValueChange={(v) => setParam("plataforma", v)}>
        <SelectTrigger className="w-40" size="sm">
          <SelectValue placeholder={t("components.analytics.platformFilterPlaceholder", "Plataforma")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("components.analytics.allPlatforms", "Todas las plataformas")}</SelectItem>
          <SelectItem value="instagram">Instagram</SelectItem>
          <SelectItem value="tiktok">TikTok</SelectItem>
          <SelectItem value="youtube">YouTube</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentDays} onValueChange={(v) => setParam("dias", v)}>
        <SelectTrigger className="w-36" size="sm">
          <SelectValue placeholder={t("components.analytics.windowFilterPlaceholder", "Ventana")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">{t("components.analytics.last7Days", "Últimos 7 días")}</SelectItem>
          <SelectItem value="30">{t("components.analytics.last30Days", "Últimos 30 días")}</SelectItem>
          <SelectItem value="90">{t("components.analytics.last90Days", "Últimos 90 días")}</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X /> {t("components.analytics.clearFilters", "Limpiar")}
        </Button>
      )}
    </div>
  );
}
