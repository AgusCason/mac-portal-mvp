import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getEditorRates,
  getEditorPayouts,
  computeEditorFinanceTotals,
} from "@/lib/queries/editor-finance";
import { FinanceKpiRow } from "@/components/finance/finance-kpi-row";
import { EditorRatesList } from "@/components/finance/editor-rates-list";
import { PayoutList } from "@/components/finance/payout-list";
import { NewPayoutDialog } from "@/components/finance/new-payout-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getT } from "@/lib/i18n/dictionary";

/** Ficha individual de Finanzas de Equipo — tarifas por cliente + historial completo de un editor. */
export default async function AdminEditorFinancePage({
  params,
}: {
  params: Promise<{ editorId: string }>;
}) {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const { editorId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: editor } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", editorId)
    .eq("role", "editor")
    .maybeSingle();

  if (!editor) notFound();

  const [rates, payouts] = await Promise.all([getEditorRates(editorId), getEditorPayouts(editorId)]);
  const totals = computeEditorFinanceTotals(payouts);
  const clientOptions = rates.map((r) => ({ id: r.clientId, name: r.clientName }));

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarFallback className="bg-foreground/10 text-[10px] font-bold">
                {getInitials(editor.full_name || editor.email)}
              </AvatarFallback>
            </Avatar>
            <span>{editor.full_name || editor.email}</span>
          </div>
        }
        title={t("pages.finanzasEquipoDetail.title", "Finanzas de este editor")}
        description={t(
          "pages.finanzasEquipoDetail.description",
          "Tarifa acordada por cada cliente y el historial completo de pagos hechos y pendientes."
        )}
      />

      <FinanceKpiRow totals={totals} language={profile.language} />

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.finanzasEquipoDetail.ratesTitle", "Tarifas por cliente")}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditorRatesList rates={rates} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{t("pages.finanzasEquipoDetail.historyTitle", "Historial de pagos")}</CardTitle>
          <NewPayoutDialog editorId={editorId} clients={clientOptions} />
        </CardHeader>
        <CardContent>
          <PayoutList payouts={payouts} clients={clientOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
