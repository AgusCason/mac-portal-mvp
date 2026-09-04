import Link from "next/link";
import { UserCog, ArrowUpRight, TrendingDown, CircleCheck, Sparkles, Building2 } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ContentStatusChart } from "@/components/dashboard/content-status-chart";
import { BillingHeroCard, INITIALS_GRADIENTS } from "@/components/dashboard/billing-hero-card";
import { AccountsHeroCard } from "@/components/dashboard/accounts-hero-card";
import { ProgressRing } from "@/components/shared/mini-charts";
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
import { formatDate, getInitials, cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/nav-config";
import { MAX_AGENT, getAgentRole, getAgentTagline } from "@/lib/ai/agents";
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
        <p className="text-primary mb-2.5 text-[10px] font-bold tracking-[0.16em] uppercase">
          {ROLE_LABELS[profile.role]} / {t("components.dashboard.adminTitle", "Panel general")}
        </p>
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
          {t("components.dashboard.adminGreeting", "Bienvenido de nuevo")}, {(profile.full_name || profile.email).split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">
          {t("components.dashboard.adminDesc", "Visibilidad total de cuentas, equipo, contenido en curso y facturación.")}
        </p>
      </div>

      {/* Las 2 cards "hero" — mismo patrón que .billing-card/.accounts-card
          del mockup aprobado (ícono + título + metric grande + contenido
          real debajo), en vez de las KpiCard chicas que tenían antes. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BillingHeroCard
          monthlyRevenue={data.monthlyRevenue}
          topClients={data.topClientsByRevenue}
          title={t("components.dashboard.kpiMonthlyRevenue", "Facturación mensual")}
          viewAllHref="/admin/planes"
          viewAllLabel={t("components.dashboard.viewBilling", "Ver facturación")}
          dailyCollections={data.dailyCollections}
          dailyCollectionsLabel={t("components.dashboard.dailyCollectionsLabel", "Cobros de los últimos 14 días")}
        />
        <AccountsHeroCard
          activeClients={data.activeClients}
          newClientsThisMonth={data.newClientsThisMonth}
          planMix={data.planMix}
          title={t("components.dashboard.kpiActiveAccounts", "Cuentas activas")}
          activeLabel={t("components.dashboard.accountsActiveLabel", "activas")}
          newThisMonthLabel={(n) => `+${n} ${t("components.dashboard.newThisMonth", "este mes")}`}
          viewAllHref="/admin/clientes"
          viewAllLabel={t("components.dashboard.viewAccounts", "Ver cuentas")}
          planMixEmptyLabel={t("components.dashboard.planMixEmpty", "Todavía no hay planes activos.")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          label={t("components.dashboard.kpiTeamEditors", "Editores en equipo")}
          value={data.totalEditors}
          icon={UserCog}
          tone="primary"
        />
        {/* Mismo patrón "mini-tile" del mockup: ring con el valor adentro en
            vez de icon-chip + número grande — acá el ring SÍ es una
            proporción real (`inFlight` sobre el total del pipeline
            editorial), nunca un % inventado. */}
        <Card className="flex-row items-center gap-3.5 p-4">
          <ProgressRing
            value={inFlight}
            max={data.totalContentItems}
            displayValue={inFlight}
            color="var(--warning)"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">
              {t("components.dashboard.kpiContentInProgress", "Contenido en curso")}
            </p>
            <p className="text-muted-foreground text-xs">
              {t("components.dashboard.kpiContentInProgressHint", "En edición + por aprobar + con cambios")}
            </p>
          </div>
        </Card>
      </div>

      {/* Fila: Contenido por estado (reemplaza a "Pendientes de aprobación
          del cliente" — dice aprox. lo mismo y con más nivel de detalle, ver
          charla) + Cuentas recientes, ahora con el mismo lenguaje visual de
          avatar + badge de plan que ya usaba Facturación mensual. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ContentStatusChart
            contentByStatus={data.contentByStatus}
            t={t}
            title={t("components.dashboard.contentByStatusTitle", "Contenido por estado")}
            description={t(
              "components.dashboard.contentByStatusDesc",
              "Distribución actual del pipeline editorial completo."
            )}
          />
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="icon-chip">
              <Building2 className="size-4" strokeWidth={1.75} />
            </div>
            <CardTitle>{t("components.dashboard.recentAccountsTitle", "Cuentas recientes")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentClients.map((c, i) => (
              <Link
                key={c.id}
                href={`/admin/clientes/${c.id}`}
                className="hover:bg-accent -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors duration-150"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-extrabold",
                    INITIALS_GRADIENTS[i % INITIALS_GRADIENTS.length]
                  )}
                >
                  {getInitials(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="truncate">{c.name}</span>
                    {c.plan_name && (
                      <Badge variant="secondary" className="shrink-0 text-[9px]">
                        {c.plan_name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t("components.dashboard.signedUpOn", "Cliente desde")} {formatDate(c.created_at)}
                  </p>
                </div>
                <Badge variant={c.status === "active" ? "success" : "secondary"}>
                  {ACCOUNT_STATUS_LABEL[c.status] ?? c.status}
                </Badge>
              </Link>
            ))}
            <Button asChild variant="ghost" size="sm" className="mt-1 w-full justify-between">
              <Link href="/admin/clientes">
                {t("components.dashboard.manageAccounts", "Gestionar cuentas")} <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fila: Alertas de métricas (empty-state trabajado: "Todo en orden"
          en vez de una línea de texto suelta cuando no hay caídas) +
          promo de Asistente IA (MAX, el mismo copiloto de `/admin/asistente`). */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
            {data.metricAlerts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <span className="bg-success/15 text-success flex size-12 shrink-0 items-center justify-center rounded-full">
                  <CircleCheck className="size-6" strokeWidth={2} />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-bold">
                    {t("components.dashboard.metricAlertsClearTitle", "Todo en orden")}
                  </p>
                  <p className="text-muted-foreground max-w-sm text-xs">
                    {t(
                      "components.dashboard.metricAlertsClearDesc",
                      "No detectamos caídas de 30% o más en alcance ni seguidores en ninguna cuenta."
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <span className="border-border/60 bg-accent/30 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
                    <span className="bg-success size-1.5 shrink-0 rounded-full" />
                    {t("components.dashboard.metricAlertsChipReach", "Alcance estable")}
                  </span>
                  <span className="border-border/60 bg-accent/30 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
                    <span className="bg-success size-1.5 shrink-0 rounded-full" />
                    {t("components.dashboard.metricAlertsChipFollowers", "Seguidores estable")}
                  </span>
                  <span className="border-border/60 bg-accent/30 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
                    <span className="bg-success size-1.5 shrink-0 rounded-full" />
                    {data.activeClients} {t("components.dashboard.metricAlertsChipMonitored", "cuentas monitoreadas")}
                  </span>
                </div>
              </div>
            ) : (
              data.metricAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="bg-destructive/10 text-destructive flex size-8 shrink-0 items-center justify-center rounded-full">
                      <TrendingDown className="size-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{alert.client_name}</p>
                      <p className="text-muted-foreground text-xs">
                        {METRIC_LABELS[alert.metric_type] ?? alert.metric_type} · {formatDate(alert.metric_date)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">-{Math.round(alert.drop_pct * 100)}%</Badge>
                </div>
              ))
            )}
            <Button asChild variant="ghost" size="sm" className="mt-1 w-full justify-between">
              <Link href="/admin/redes">
                {t("components.dashboard.viewSocialMedia", "Ver redes sociales")} <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Link
          href="/admin/asistente"
          className="from-primary to-info focus-visible:ring-ring flex flex-col rounded-2xl bg-gradient-to-br p-6 shadow-[var(--shadow-elevated)] transition-transform duration-150 hover:scale-[1.01] focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="bg-primary-foreground/20 mb-5 flex size-11 shrink-0 items-center justify-center rounded-full">
            <Sparkles className="text-primary-foreground size-5" strokeWidth={2} />
          </span>
          <p className="text-primary-foreground text-lg leading-tight font-extrabold tracking-tight">
            {MAX_AGENT.name} — {getAgentRole(MAX_AGENT, t)}
          </p>
          <p className="text-primary-foreground/80 mt-2.5 text-[11.5px] leading-relaxed">
            {getAgentTagline(MAX_AGENT, t)}
          </p>
          <span className="text-primary-foreground bg-foreground mt-auto inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2.5 text-[11.5px] font-extrabold">
            {t("components.dashboard.openAssistant", "Abrir asistente")} <ArrowUpRight className="size-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
