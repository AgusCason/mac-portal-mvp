import { Wrench, CalendarClock } from "lucide-react";
import type { ToolsCostOverview } from "@/lib/queries/finance-overview";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { URGENCY_BADGE } from "@/lib/finance-utils";
import { getT } from "@/lib/i18n/dictionary";
import type { ProfileLanguage } from "@/types/database";

/**
 * Bloque "Pago Herramientas" del dashboard general de Finanzas — cuánto sale
 * cada herramienta (gasto recurrente normalizado a mensual, ver
 * `computeToolsCostOverview`) y alertas de vencimiento próximo, cargadas a
 * mano por el admin en Herramientas.
 */
export function ToolsCostPanel({
  overview,
  language,
}: {
  overview: ToolsCostOverview;
  language: ProfileLanguage;
}) {
  const t = getT(language);

  return (
    <div className="space-y-4">
      {overview.byCurrency.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {overview.byCurrency.map((tot) => (
            <KpiCard
              key={tot.currency}
              label={`${t("components.finance.kpiToolsMonthly", "Gasto mensual en herramientas")} (${tot.currency})`}
              value={formatCurrency(tot.monthlyEquivalent, tot.currency)}
              icon={Wrench}
            />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            {t("components.finance.upcomingRenewals", "Próximos vencimientos")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {overview.renewals.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState
                icon={CalendarClock}
                title={t("components.finance.noUpcomingRenewals", "No hay vencimientos de herramientas cargados.")}
              />
            </div>
          ) : (
            <div className="divide-border divide-y">
              {overview.renewals.slice(0, 8).map((row) => {
                const badge = row.urgency ? URGENCY_BADGE[row.urgency] : null;
                return (
                  <div key={row.toolId} className="flex items-center justify-between gap-3 px-6 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
                    <span className="text-muted-foreground shrink-0 tabular-nums">{formatDate(row.nextRenewalDate)}</span>
                    {badge && (
                      <Badge variant={badge.variant} className="shrink-0">
                        {t(badge.key, badge.fallback)}
                      </Badge>
                    )}
                    {row.amount != null && (
                      <span className="shrink-0 tabular-nums font-semibold">{formatCurrency(row.amount, row.currency)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
