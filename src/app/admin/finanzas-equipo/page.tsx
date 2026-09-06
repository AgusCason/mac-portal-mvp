import Link from "next/link";
import { HandCoins, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getEditorFinanceOverview, mergeFinanceTotals } from "@/lib/queries/editor-finance";
import { FinanceKpiRow } from "@/components/finance/finance-kpi-row";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { INITIALS_GRADIENTS } from "@/components/dashboard/billing-hero-card";
import { getInitials, cn, formatCurrency } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Finanzas de Equipo — panel GENERAL (Fase pedida por el admin): un resumen
 * agregado de toda la agencia arriba, y una fila por editor abajo con lo
 * que se le pagó/le falta pagar — cada fila linkea a `[editorId]`, el panel
 * INDIVIDUAL con el detalle completo (tarifas por cliente + historial).
 */
export default async function AdminFinanzasEquipoPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const overview = await getEditorFinanceOverview();
  const agencyTotals = mergeFinanceTotals(overview.map((o) => o.totals));

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.finanzasEquipo.title", "Finanzas de Equipo")}
        description={t(
          "pages.finanzasEquipo.description",
          "Cuánto se le paga a cada editor por cada cliente, y el historial completo de pagos hechos y pendientes."
        )}
      />

      <FinanceKpiRow totals={agencyTotals} language={profile.language} />

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {overview.length === 0 && (
            <EmptyState
              icon={HandCoins}
              title={t("pages.finanzasEquipo.noEditors", "Todavía no hay editores en el equipo.")}
              className="border-none"
            />
          )}
          {overview.map((row, i) => (
            <Link
              key={row.editorId}
              href={`/admin/finanzas-equipo/${row.editorId}`}
              className="hover:bg-accent/40 flex items-center gap-3 px-4 py-3.5 transition-colors duration-150"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-extrabold",
                  INITIALS_GRADIENTS[i % INITIALS_GRADIENTS.length]
                )}
              >
                {getInitials(row.editorName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-tight">{row.editorName}</p>
                <p className="text-muted-foreground text-xs">
                  {row.ratesCount} {t("pages.finanzasEquipo.clientsWithRate", "cliente(s) con tarifa definida")}
                </p>
              </div>
              <div className="hidden shrink-0 gap-6 text-right sm:flex">
                {row.totals.length === 0 && (
                  <span className="text-muted-foreground text-xs">
                    {t("pages.finanzasEquipo.noPayoutsYet", "Sin pagos cargados")}
                  </span>
                )}
                {row.totals.map((tot) => (
                  <div key={tot.currency}>
                    <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                      {t("pages.finanzasEquipo.pendingLabel", "Pendiente")} {tot.currency}
                    </p>
                    <p className="tabular-nums text-sm font-semibold">{formatCurrency(tot.pending, tot.currency)}</p>
                  </div>
                ))}
              </div>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
