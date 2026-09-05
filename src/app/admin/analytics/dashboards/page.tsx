import { requireRole } from "@/lib/auth";
import { getPlatformDashboards } from "@/lib/queries/analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FollowersDonutChart, EngagementBarChart } from "@/components/analytics/overview-charts";
import { Camera, Music2, PlaySquare, LayoutDashboard, Users, Activity } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";
import type { SocialPlatform } from "@/types/database";

// lucide-react v1 no incluye íconos de marca (Instagram/TikTok/YouTube) — genéricos.
const PLATFORM_ICON: Record<SocialPlatform, typeof Camera> = {
  instagram: Camera,
  tiktok: Music2,
  youtube: PlaySquare,
};

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

/**
 * Analytics > Dashboards — una vista resumen por plataforma conectada (en
 * vez del armado libre de widgets de MB Suite): alcance, seguidores y
 * engagement agregados de todas las cuentas de esa plataforma.
 */
export default async function AnalyticsDashboardsPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const dashboards = await getPlatformDashboards();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.analytics.dashboards", "Dashboards")}
        description={t("pages.analyticsDashboards.description", "Vistas resumen por plataforma, con datos reales de las cuentas conectadas.")}
      />

      {dashboards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="glass-card">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="icon-chip">
                <Users className="size-4" strokeWidth={1.75} />
              </div>
              <CardTitle>{t("pages.analyticsOverview.followersByPlatform", "Seguidores por plataforma")}</CardTitle>
            </CardHeader>
            <CardContent>
              <FollowersDonutChart data={dashboards} />
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="icon-chip">
                <Activity className="size-4" strokeWidth={1.75} />
              </div>
              <CardTitle>{t("pages.analyticsOverview.engagementByPlatform", "Engagement por plataforma")}</CardTitle>
            </CardHeader>
            <CardContent>
              <EngagementBarChart data={dashboards} />
            </CardContent>
          </Card>
        </div>
      )}

      {dashboards.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <LayoutDashboard className="text-muted-foreground size-8" strokeWidth={1.5} />
            <p className="text-sm font-medium">{t("pages.analyticsDashboards.empty", "Todavía no hay cuentas conectadas")}</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              {t(
                "pages.analyticsDashboards.emptyHint",
                "En cuanto se conecte una cuenta social desde una Cuenta, acá va a aparecer su dashboard."
              )}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dashboards.map((d) => {
          const Icon = PLATFORM_ICON[d.platform];
          return (
            <Card key={d.platform} className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className="size-4" /> {PLATFORM_LABEL[d.platform]}
                </CardTitle>
                <CardDescription>
                  {d.accountCount}{" "}
                  {d.accountCount === 1
                    ? t("pages.analyticsDashboards.accountSingular", "cuenta")
                    : t("pages.analyticsDashboards.accountPlural", "cuentas")}{" "}
                  {d.accountCount === 1
                    ? t("pages.analyticsDashboards.connectedSingular", "conectada")
                    : t("pages.analyticsDashboards.connectedPlural", "conectadas")}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-xs uppercase">{t("pages.analyticsDashboards.reach", "Alcance")}</p>
                  <p className="tabular-nums font-medium">{d.totalReach.toLocaleString("es-AR")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">{t("pages.analyticsDashboards.followers", "Seguidores")}</p>
                  <p className="tabular-nums font-medium">{d.totalFollowers.toLocaleString("es-AR")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">{t("pages.analyticsDashboards.engagement", "Engagement")}</p>
                  <p className="tabular-nums font-medium">{d.avgEngagementRate.toFixed(2)}%</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
