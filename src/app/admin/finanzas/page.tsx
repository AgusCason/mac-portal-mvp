import Link from "next/link";
import { Users, Wrench, HandCoins, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  getClientPaymentsOverview,
  getToolsCostOverview,
  getEditorPayoutsMonthly,
} from "@/lib/queries/finance-overview";
import { getEditorFinanceOverview, mergeFinanceTotals } from "@/lib/queries/editor-finance";
import { ClientPaymentsPanel } from "@/components/finance/client-payments-panel";
import { ToolsCostPanel } from "@/components/finance/tools-cost-panel";
import { EditorPayoutsPanel } from "@/components/finance/editor-payouts-panel";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Finanzas (general) — dashboard con las tres patas de la plata de la
 * agencia en un solo lugar: lo que pagan los clientes (billing_invoices, ya
 * existía), lo que sale mantener las herramientas (agency_tools.cost_*,
 * nuevo) y lo que se le paga al equipo de editores (editor_payouts, ya
 * existía). Cada bloque linkea a su sección de detalle real.
 */
export default async function AdminFinanzasPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);

  const [clientPayments, toolsCost, editorOverview, editorMonthly] = await Promise.all([
    getClientPaymentsOverview(),
    getToolsCostOverview(),
    getEditorFinanceOverview(),
    getEditorPayoutsMonthly(),
  ]);
  const editorTotals = mergeFinanceTotals(editorOverview.map((o) => o.totals));

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("pages.finanzas.title", "Finanzas")}
        description={t(
          "pages.finanzas.description",
          "Lo que pagan los clientes, lo que salen las herramientas de la agencia, y lo que se le paga al equipo — todo en un solo lugar."
        )}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <Users className="text-muted-foreground size-4" />
            {t("pages.finanzas.clientsTitle", "Pago Clientes")}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/planes">
              {t("pages.finanzas.viewBilling", "Ver facturación")} <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <ClientPaymentsPanel overview={clientPayments} language={profile.language} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <Wrench className="text-muted-foreground size-4" />
            {t("pages.finanzas.toolsTitle", "Pago Herramientas")}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/finanzas/herramientas">
              {t("pages.finanzas.viewTools", "Ver detalle de costos")} <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <ToolsCostPanel overview={toolsCost} language={profile.language} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <HandCoins className="text-muted-foreground size-4" />
            {t("pages.finanzas.editorsTitle", "Pago Editor")}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/finanzas-equipo">
              {t("pages.finanzas.viewEditors", "Ver detalle por editor")} <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        {editorTotals.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("pages.finanzas.noEditorPayouts", "Todavía no hay pagos de editores cargados.")}
          </p>
        ) : (
          <EditorPayoutsPanel totals={editorTotals} monthly={editorMonthly} language={profile.language} />
        )}
      </section>
    </div>
  );
}
