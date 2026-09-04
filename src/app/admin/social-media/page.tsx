import Link from "next/link";
import { CalendarClock, Radar, Compass, Sparkles, Swords, LayoutGrid, Camera, Music2, PlaySquare } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getSocialMediaOverview } from "@/lib/queries/social-media";
import { ContentStatusChart } from "@/components/dashboard/content-status-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutMini } from "@/components/shared/mini-charts";
import { formatDate } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";
import type { ContentStatus } from "@/types/database";

const CONTENT_STATUS_ORDER: ContentStatus[] = [
  "borrador",
  "en_edicion",
  "por_aprobar",
  "requiere_cambios",
  "aprobado",
  "programado",
  "publicado",
];

// lucide-react v1 no incluye íconos de marca (Instagram/TikTok/YouTube) — íconos genéricos,
// mismo criterio que ya usa /admin/redes.
const PLATFORM_ICON = { instagram: Camera, tiktok: Music2, youtube: PlaySquare } as const;
const PLATFORM_LABEL: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" };
const PLATFORM_COLOR: Record<string, string> = {
  instagram: "var(--info)",
  tiktok: "var(--warning)",
  youtube: "var(--destructive)",
};
const PLATFORM_ORDER = ["instagram", "tiktok", "youtube"];

/**
 * Social Media > Overview — resumen ejecutivo del módulo, equivalente a
 * `/demo-agency/social-media/overview` de MB Suite.
 */
export default async function AdminSocialMediaPage() {
  const profile = await requireAdmin();
  const t = getT(profile.language);
  const overview = await getSocialMediaOverview();

  const contentByStatus = Object.fromEntries(
    CONTENT_STATUS_ORDER.map((s) => [s, overview.byStatus[s] ?? 0])
  ) as Record<ContentStatus, number>;
  const platformEntries = PLATFORM_ORDER.filter((p) => (overview.accountsByPlatform[p] ?? 0) > 0);

  const SHORTCUTS = [
    { label: t("nav.socialMedia.insights", "Insights"), href: "/admin/redes", icon: Radar, description: t("pages.socialOverview.shortcutInsightsDesc", "Métricas y monitoreo por cuenta") },
    { label: t("nav.socialMedia.planner", "Planner"), href: "/admin/social-media/planner", icon: Compass, description: t("pages.socialOverview.shortcutPlannerDesc", "Calendario y kanban de piezas") },
    {
      label: t("nav.socialMedia.contentStudio", "Content Studio"),
      href: "/admin/social-media/content-studio",
      icon: Sparkles,
      description: t("pages.socialOverview.shortcutStudioDesc", "Banco de ideas, guiones y captions"),
    },
    {
      label: t("nav.socialMedia.brandVoice", "Brand Voice"),
      href: "/admin/social-media/brand-voice",
      icon: LayoutGrid,
      description: t("pages.socialOverview.shortcutBrandDesc", "Tono de marca por cuenta"),
    },
    { label: t("nav.socialMedia.competidores", "Competidores"), href: "/admin/social-media/competidores", icon: Swords, description: t("pages.socialOverview.shortcutCompetDesc", "Benchmark de la competencia") },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("nav.socialMedia.group", "Social Media")}</h1>
        <p className="text-muted-foreground text-sm">{t("pages.socialOverview.description", "Resumen de piezas, cuentas conectadas y próximas publicaciones.")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase">{t("pages.socialOverview.totalPieces", "Piezas totales")}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{overview.totalPieces}</CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase">{t("pages.socialOverview.connectedAccounts", "Cuentas conectadas")}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{overview.connectedAccounts}</CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase">{t("pages.socialOverview.scheduled", "Programadas")}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{overview.byStatus["programado"] ?? 0}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarClock className="size-4" /> {t("pages.socialOverview.upcoming", "Próximas publicaciones")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview.scheduledPieces.length === 0 && (
              <p className="text-muted-foreground text-sm">{t("pages.socialOverview.noScheduled", "No hay piezas programadas.")}</p>
            )}
            {overview.scheduledPieces.map((item) => (
              <div key={item.id} className="bg-accent/40 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-muted-foreground truncate text-xs">{item.client_name}</p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">{formatDate(item.scheduled_at!)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {overview.totalPieces === 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">{t("pages.socialOverview.byStatus", "Piezas por estado")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{t("pages.socialOverview.noPieces", "Todavía no hay piezas cargadas.")}</p>
            </CardContent>
          </Card>
        )}
        {overview.totalPieces > 0 && (
          <ContentStatusChart
            contentByStatus={contentByStatus}
            t={t}
            title={t("pages.socialOverview.byStatus", "Piezas por estado")}
            description={t("pages.socialOverview.byStatusDesc", "Distribución de piezas del módulo por estado.")}
          />
        )}
      </div>

      {platformEntries.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="icon-chip">
              <Radar className="size-4" strokeWidth={1.75} />
            </div>
            <CardTitle>{t("pages.socialOverview.byPlatformTitle", "Cuentas conectadas por plataforma")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around">
            <DonutMini
              segments={platformEntries.map((platform) => ({
                label: PLATFORM_LABEL[platform] ?? platform,
                value: overview.accountsByPlatform[platform] ?? 0,
                color: PLATFORM_COLOR[platform] ?? "var(--muted-foreground)",
              }))}
              centerValue={overview.connectedAccounts}
              centerLabel={t("pages.socialOverview.byPlatformCenterLabel", "cuentas")}
            />
            <div className="flex w-full flex-wrap justify-center gap-x-5 gap-y-2 sm:max-w-sm">
              {platformEntries.map((platform) => {
                const Icon = PLATFORM_ICON[platform as keyof typeof PLATFORM_ICON];
                const count = overview.accountsByPlatform[platform] ?? 0;
                return (
                  <div key={platform} className="flex items-center gap-2 text-xs">
                    <Icon className="size-3.5" style={{ color: PLATFORM_COLOR[platform] }} />
                    <span className="text-muted-foreground">{PLATFORM_LABEL[platform] ?? platform}</span>
                    <strong className="tabular-nums">{count}</strong>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="glass-card group flex items-center gap-3 rounded-xl p-4 transition-colors hover:border-primary/40"
          >
            <div className="icon-chip">
              <s.icon className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-muted-foreground truncate text-xs">{s.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
