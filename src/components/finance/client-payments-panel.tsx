import { TrendingUp, Clock, AlertTriangle } from "lucide-react";
import type { ClientPaymentsOverview } from "@/lib/queries/finance-overview";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MiniMonthlyChart, type MiniChartPoint } from "@/components/finance/mini-monthly-chart";
import { FinanceAlertBanner } from "@/components/finance/finance-alert-banner";
import { getDateUrgency } from "@/lib/finance-utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";
import type { ProfileLanguage } from "@/types/database";

/**
 * Bloque "Pago Clientes" del dashboard general de Finanzas — reutiliza
 * billing_invoices (ya es la fuente real de "lo que pagan los clientes"),
 * no duplica datos. Total del mes + pendiente + atrasado por moneda, el
 * gráfico de evolución mensual (últimos 6 meses) y la lista de próximos
 * vencimientos por cliente.
 */
export function ClientPaymentsPanel({
  overview,
  language,
}: {
  overview: ClientPaymentsOverview;
  language: ProfileLanguage;
}) {
  const t = getT(language);
  const overdueCount = overview.upcoming.filter((u) => u.isOverdue).length;
  const urgentCount = overview.upcoming.filter(
    (u) => !u.isOverdue && getDateUrgency(u.dueDate) === "urgent"
  ).length;

  return (
    <div className="space-y-4">
      <FinanceAlertBanner
        overdueCount={overdueCount}
        urgentCount={urgentCount}
        overdueLabel={t("components.finance.alertClientsOverdue", "pagos atrasados")}
        urgentLabel={t("components.finance.alertClientsDueSoon", "vencen esta semana")}
      />

      {overview.byCurrency.length > 0 && (
        <div className="space-y-3">
          {overview.byCurrency.map((tot) => (
            <div key={tot.currency} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard
                label={`${t("components.finance.kpiCollectedThisMonth", "Cobrado este mes")} (${tot.currency})`}
                value={formatCurrency(tot.collectedThisMonth, tot.currency)}
                icon={TrendingUp}
              />
              <KpiCard
                label={`${t("components.finance.kpiPending", "Pendiente")} (${tot.currency})`}
                value={formatCurrency(tot.pendingTotal, tot.currency)}
                icon={Clock}
              />
              <KpiCard
                label={`${t("components.finance.kpiOverdue", "Atrasado")} (${tot.currency})`}
                value={formatCurrency(tot.overdueTotal, tot.currency)}
                icon={AlertTriangle}
              />
            </div>
          ))}
        </div>
      )}

      {overview.monthly.map((analytics) => {
        if (!analytics.hasData) return null;
        const points: MiniChartPoint[] = analytics.monthly.map((m) => ({
          key: m.month,
          label: m.label,
          values: { paid: m.paid, pending: m.pending, overdue: m.overdue },
          total: m.paid + m.pending + m.overdue,
        }));
        return (
          <Card key={analytics.currency}>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                {t("components.finance.clientMonthlyChartTitle", "Cobros mensuales")} ({analytics.currency})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MiniMonthlyChart
                data={points}
                currency={analytics.currency}
                segments={[
                  { key: "paid", label: t("components.finance.kpiCollectedThisMonth", "Cobrado"), barClass: "bg-success", dotClass: "bg-success" },
                  { key: "pending", label: t("components.finance.kpiPending", "Pendiente"), barClass: "bg-primary", dotClass: "bg-primary" },
                  { key: "overdue", label: t("components.finance.kpiOverdue", "Atrasado"), barClass: "bg-destructive", dotClass: "bg-destructive" },
                ]}
              />
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            {t("components.finance.upcomingClientPayments", "Próximos pagos por cliente")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {overview.upcoming.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState
                icon={Clock}
                title={t("components.finance.noUpcomingClientPayments", "No hay pagos de clientes pendientes.")}
              />
            </div>
          ) : (
            <div className="divide-border divide-y">
              {overview.upcoming.slice(0, 8).map((row, i) => (
                <div key={`${row.clientId}-${row.dueDate}-${i}`} className="flex items-center justify-between gap-3 px-6 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium">{row.clientName}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">{formatDate(row.dueDate)}</span>
                  {row.isOverdue && (
                    <Badge variant="destructive" className="shrink-0">
                      {t("components.tools.renewalOverdue", "Vencida")}
                    </Badge>
                  )}
                  <span className="shrink-0 tabular-nums font-semibold">{formatCurrency(row.amount, row.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
