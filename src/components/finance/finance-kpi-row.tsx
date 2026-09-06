import { Wallet, Clock, TrendingUp } from "lucide-react";
import type { EditorFinanceTotalsByCurrency } from "@/lib/queries/editor-finance";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";
import type { ProfileLanguage } from "@/types/database";

/**
 * Fila de KPIs de Finanzas de Equipo — una tarjeta por cada combinación
 * moneda×métrica, porque los totales nunca se mezclan entre monedas (ver
 * `computeEditorFinanceTotals`). La mayoría de las agencias van a ver una
 * sola fila (todo en ARS, o todo en USD); si un editor cobra en las dos,
 * simplemente aparecen dos juegos de tarjetas.
 */
export function FinanceKpiRow({
  totals,
  language,
}: {
  totals: EditorFinanceTotalsByCurrency[];
  language: ProfileLanguage;
}) {
  const t = getT(language);

  if (totals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {totals.map((tot) => (
        <div key={tot.currency} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label={`${t("components.finance.kpiPaidThisMonth", "Pagado este mes")} (${tot.currency})`}
            value={formatCurrency(tot.paidThisMonth, tot.currency)}
            icon={TrendingUp}
          />
          <KpiCard
            label={`${t("components.finance.kpiPending", "Pendiente")} (${tot.currency})`}
            value={formatCurrency(tot.pending, tot.currency)}
            icon={Clock}
            hint={
              tot.nextDueDate
                ? `${t("components.finance.kpiNextDue", "Próximo")}: ${formatDate(tot.nextDueDate)}`
                : undefined
            }
          />
          <KpiCard
            label={`${t("components.finance.kpiPaidAllTime", "Total histórico pagado")} (${tot.currency})`}
            value={formatCurrency(tot.paidAllTime, tot.currency)}
            icon={Wallet}
          />
        </div>
      ))}
    </div>
  );
}
