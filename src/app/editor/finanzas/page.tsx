import { requireRole } from "@/lib/auth";
import { getEditorRates, getEditorPayouts, computeEditorFinanceTotals } from "@/lib/queries/editor-finance";
import { FinanceKpiRow } from "@/components/finance/finance-kpi-row";
import { MyRatesList } from "@/components/finance/my-rates-list";
import { MyPayoutList } from "@/components/finance/my-payout-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Mis Pagos (/editor/finanzas) — lo que el editor pidió explícitamente: ver
 * cuánto le pagan por cada cliente, cuándo, y el historial completo (lo que
 * ya cobró + lo que todavía tiene pendiente). 100% de solo lectura — RLS
 * (`editor_payouts_editor_select`) ya garantiza que solo ve SUS propias
 * filas, nunca las de otro editor.
 */
export default async function EditorFinanzasPage() {
  const profile = await requireRole(["editor"]);
  const t = getT(profile.language);

  const [rates, payouts] = await Promise.all([
    getEditorRates(profile.id),
    getEditorPayouts(profile.id),
  ]);
  const totals = computeEditorFinanceTotals(payouts);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.editorFinanzas.title", "Mis Pagos")}
        description={t(
          "pages.editorFinanzas.description",
          "Lo que cobrás por cada cliente, cuándo se espera el próximo pago, y tu historial completo."
        )}
      />

      <FinanceKpiRow totals={totals} language={profile.language} />

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.editorFinanzas.ratesTitle", "Tarifa por cliente")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MyRatesList rates={rates} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.editorFinanzas.historyTitle", "Historial de pagos")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MyPayoutList payouts={payouts} />
        </CardContent>
      </Card>
    </div>
  );
}
