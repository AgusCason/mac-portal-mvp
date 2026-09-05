import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getAnalyticsOverview, getPlatformDashboards, getReachTrend } from "@/lib/queries/analytics";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ReachTrendChart, FollowersDonutChart, EngagementBarChart } from "@/components/analytics/overview-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";
import {
  Radar,
  Eye,
  Users,
  TrendingUp,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  LayoutDashboard,
  Compass,
  Send,
  Link2,
} from "lucide-react";

/**
 * Analytics > Overview — equivalente a `/demo-agency/analytics` de MB Suite:
 * KPIs agregados de toda la agencia (no de un cliente puntual, como sí hace
 * el Módulo de Reportes) + accesos directos a las 7 sub-secciones restantes.
 */
export default async function AdminAnalyticsPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const [overview, platforms, reachTrend] = await Promise.all([
    getAnalyticsOverview(),
    getPlatformDashboards(),
    getReachTrend(14),
  ]);

  const SHORTCUTS = [
    {
      href: "/admin/redes",
      icon: Radar,
      label: t("pages.analyticsOverview.shortcutMonitors", "Monitors"),
      description: t("pages.analyticsOverview.shortcutMonitorsDesc", "Cuentas sociales conectadas y su última métrica cargada."),
    },
    {
      href: "/admin/analytics/dashboards",
      icon: LayoutDashboard,
      label: t("nav.analytics.dashboards", "Dashboards"),
      description: t("pages.analyticsOverview.shortcutDashboardsDesc", "Vistas armadas por tema: alcance, engagement, crecimiento."),
    },
    {
      href: "/admin/analytics/explorer",
      icon: Compass,
      label: t("nav.analytics.explorer", "Explorer"),
      description: t("pages.analyticsOverview.shortcutExplorerDesc", "Tabla plana y filtrable de todas las métricas cargadas."),
    },
    {
      href: "/admin/reportes",
      icon: FileText,
      label: t("nav.analytics.reports", "Reports"),
      description: t("pages.analyticsOverview.shortcutReportsDesc", "Reportes con IA por cliente, borrador o publicados."),
    },
    {
      href: "/admin/analytics/alertas",
      icon: AlertTriangle,
      label: t("pages.analyticsAlertas.title", "Alertas de métricas"),
      description: t("pages.analyticsOverview.shortcutAlertasDesc", "Caídas de métricas detectadas automáticamente."),
    },
    {
      href: "/admin/analytics/envios",
      icon: Send,
      label: t("nav.analytics.envios", "Envíos"),
      description: t("pages.analyticsOverview.shortcutEnviosDesc", "Historial de reportes publicados y enviados a clientes."),
    },
    {
      href: "/admin/analytics/utm-builder",
      icon: Link2,
      label: t("nav.analytics.utmBuilder", "UTM Builder"),
      description: t("pages.analyticsOverview.shortcutUtmDesc", "Arma URLs de campaña con parámetros UTM."),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.analyticsOverview.title", "Analytics")}
        description={t("pages.analyticsOverview.description", "Rendimiento agregado de todas las cuentas conectadas de la agencia.")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label={t("pages.analyticsOverview.connectedAccounts", "Cuentas conectadas")} value={overview.connectedAccounts} icon={Radar} />
        <KpiCard label={t("pages.analyticsOverview.totalFollowers", "Seguidores totales")} value={overview.totalFollowers.toLocaleString("es-AR")} icon={Users} />
        <KpiCard
          label={t("pages.analyticsOverview.avgEngagement", "Engagement promedio")}
          value={`${overview.avgEngagementRate.toFixed(2)}%`}
          icon={TrendingUp}
        />
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Eye className="size-4" /> {t("pages.analyticsOverview.totalReach", "Alcance total")}
            <span className="text-muted-foreground font-normal">
              — {t("pages.analyticsOverview.last14Days", "últimos 14 días")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReachTrendChart data={reachTrend} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="size-4" /> {t("pages.analyticsOverview.followersByPlatform", "Seguidores por plataforma")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FollowersDonutChart data={platforms} />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4" /> {t("pages.analyticsOverview.engagementByPlatform", "Engagement promedio por plataforma")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EngagementBarChart data={platforms} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="text-destructive size-4" /> {t("pages.analyticsOverview.metricAlerts", "Alertas de métricas")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="tabular-nums text-2xl font-semibold">{overview.activeAlerts}</p>
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/analytics/alertas">
                {t("pages.analyticsOverview.viewAll", "Ver todas")} <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="text-info size-4" /> {t("pages.analyticsOverview.reportsThisMonth", "Reportes este mes")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="tabular-nums text-2xl font-semibold">{overview.reportsThisMonth}</p>
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/reportes">
                {t("pages.analyticsOverview.goToReports", "Ir a Reports")} <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">{t("pages.analyticsOverview.tools", "Herramientas")}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="glass-card group flex items-start gap-3 rounded-xl p-4 transition-colors hover:border-primary/40"
            >
              <div className="icon-chip">
                <s.icon className="size-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-muted-foreground text-xs">{s.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
