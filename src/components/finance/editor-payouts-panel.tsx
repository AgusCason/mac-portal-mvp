import type { EditorFinanceTotalsByCurrency } from "@/lib/queries/editor-finance";
import type { EditorPayoutsMonthly } from "@/lib/queries/finance-overview";
import { FinanceKpiRow } from "@/components/finance/finance-kpi-row";
import { FinanceAlertBanner } from "@/components/finance/finance-alert-banner";
import { MiniMonthlyChart, type MiniChartPoint } from "@/components/finance/mini-monthly-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDateUrgency } from "@/lib/finance-utils";
import { getT } from "@/lib/i18n/dictionary";
import type { ProfileLanguage } from "@/types/database";

/**
 * Bloque "Pago Editor" del dashboard general de Finanzas — reusa
 * `FinanceKpiRow` (mismo componente que ya usa Finanzas de Equipo) y suma el
 * gráfico de evolución mensual agregada (todos los editores, ver
 * `getEditorPayoutsMonthly`) más una alerta si hay pagos vencidos o por
 * vencer esta semana.
 */
export function EditorPayoutsPanel({
  totals,
  monthly,
  language,
}: {
  totals: EditorFinanceTotalsByCurrency[];
  monthly: EditorPayoutsMonthly[];
  language: ProfileLanguage;
}) {
  const t = getT(language);
  const overdueCount = totals.filter((tot) => getDateUrgency(tot.nextDueDate) === "overdue").length;
  const urgentCount = totals.filter((tot) => getDateUrgency(tot.nextDueDate) === "urgent").length;

  return (
    <div className="space-y-4">
      <FinanceAlertBanner
        overdueCount={overdueCount}
        urgentCount={urgentCount}
        overdueLabel={t("components.finance.alertEditorsOverdue", "pagos a editores vencidos")}
        urgentLabel={t("components.finance.alertEditorsDueSoon", "vencen esta semana")}
      />

      <FinanceKpiRow totals={totals} language={language} />

      {monthly.map((series) => {
        const points: MiniChartPoint[] = series.monthly.map((m) => ({
          key: m.month,
          label: m.label,
          values: { paid: m.paid, pending: m.pending },
          total: m.total,
        }));
        const hasData = series.monthly.some((m) => m.total > 0);
        if (!hasData) return null;
        return (
          <Card key={series.currency}>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                {t("components.finance.editorMonthlyChartTitle", "Pagos a editores mensuales")} ({series.currency})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MiniMonthlyChart
                data={points}
                currency={series.currency}
                segments={[
                  { key: "paid", label: t("components.finance.kpiPaidThisMonth", "Pagado"), barClass: "bg-success", dotClass: "bg-success" },
                  { key: "pending", label: t("components.finance.kpiPending", "Pendiente"), barClass: "bg-primary", dotClass: "bg-primary" },
                ]}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
