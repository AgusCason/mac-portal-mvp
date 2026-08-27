import Link from "next/link";
import { Users, UserCog, Wallet, Clock, ArrowUpRight, TrendingDown } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ContentStatusBadge } from "@/components/dashboard/content-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/dictionary";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AdminDashboardData } from "@/lib/queries/dashboard";
import type { Profile } from "@/types/database";

/** Vista del dashboard para el Super Administrador (Agencia / Project Manager). */
export function AdminDashboard({ data, profile }: { data: AdminDashboardData; profile: Profile }) {
  const t = getT(profile.language);
  const inFlight =
    data.contentByStatus.en_edicion +
    data.contentByStatus.por_aprobar +
    data.contentByStatus.requiere_cambios;

  const METRIC_LABELS: Record<string, string> = {
    reach: t("pages.redes.reach", "Alcance"),
    followers: t("pages.redes.followers", "Seguidores"),
  };

  const ACCOUNT_STATUS_LABEL: Record<string, string> = {
    active: t("pages.clienteDetail.statusActive", "Activo"),
    paused: t("pages.clienteDetail.statusPaused", "Pausado"),
    churned: t("pages.clienteDetail.statusLost", "Perdido"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("components.dashboard.adminTitle", "Panel general")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("components.dashboard.adminDesc", "Visibilidad total de cuentas, equipo, contenido en curso y facturación.")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("components.dashboard.kpiActiveAccounts", "Cuentas activas")}
          value={`${data.activeClients}/${data.totalClients}`}
          icon={Users}
          hint={t("components.dashboard.kpiActiveAccountsHint", "Cuentas activas sobre el total")}
        />
        <KpiCard label={t("components.dashboard.kpiTeamEditors", "Editores en equipo")} value={data.totalEditors} icon={UserCog} />
        <KpiCard
          label={t("components.dashboard.kpiMonthlyRevenue", "Facturación mensual")}
          value={formatCurrency(data.monthlyRevenue)}
          icon={Wallet}
          hint={t("components.dashboard.kpiMonthlyRevenueHint", "Suma de planes activos")}
        />
        <KpiCard
          label={t("components.dashboard.kpiContentInProgress", "Contenido en curso")}
          value={inFlight}
          icon={Clock}
          hint={t("components.dashboard.kpiContentInProgressHint", "En edición + por aprobar + con cambios")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("components.dashboard.pendingClientApprovalTitle", "Pendientes de aprobación del cliente")}</CardTitle>
            <CardDescription>
              {t("components.dashboard.pendingClientApprovalDesc", "Contenido esperando revisión — el cuello de botella típico del flujo editorial.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.pendingApprovals.length === 0 && (
              <p className="text-muted-foreground text-sm">
                {t("components.dashboard.noPendingApprovalNow", "No hay piezas esperando aprobación ahora mismo.")}
              </p>
            )}
            {data.pendingApprovals.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-xs">{item.client_name}</p>
                </div>
                <ContentStatusBadge status="por_aprobar" t={t} />
              </div>
            ))}
            <Button asChild variant="ghost" size="sm" className="mt-1 w-full justify-between">
              <Link href="/admin/calendario">
                {t("components.dashboard.viewFullCalendar", "Ver calendario completo")} <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("components.dashboard.recentAccountsTitle", "Cuentas recientes")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentClients.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {t("components.dashboard.signedUpOn", "Alta")} {formatDate(c.created_at)}
                  </p>
                </div>
                <Badge variant={c.status === "active" ? "success" : "secondary"}>
                  {ACCOUNT_STATUS_LABEL[c.status] ?? c.status}
                </Badge>
              </div>
            ))}
            <Button asChild variant="ghost" size="sm" className="mt-1 w-full justify-between">
              <Link href="/admin/clientes">
                {t("components.dashboard.manageAccounts", "Gestionar cuentas")} <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("components.dashboard.metricAlertsTitle", "Alertas de métricas")}</CardTitle>
          <CardDescription>
            {t(
              "components.dashboard.metricAlertsDesc",
              "Caídas de 30% o más en alcance o seguidores vs. el promedio de los días previos (Fase 3.4 — revisado automáticamente todos los días)."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.metricAlerts.length === 0 && (
            <p className="text-muted-foreground text-sm">{t("pages.analyticsAlertas.empty", "Sin caídas detectadas por ahora")}.</p>
          )}
          {data.metricAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <TrendingDown className="text-destructive size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{alert.client_name}</p>
                  <p className="text-muted-foreground text-xs">
                    {METRIC_LABELS[alert.metric_type] ?? alert.metric_type} · {formatDate(alert.metric_date)}
                  </p>
                </div>
              </div>
              <Badge variant="destructive">-{Math.round(alert.drop_pct * 100)}%</Badge>
            </div>
          ))}
          <Button asChild variant="ghost" size="sm" className="mt-1 w-full justify-between">
            <Link href="/admin/redes">
              {t("components.dashboard.viewSocialMedia", "Ver redes sociales")} <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
