import { requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getInvoices, getBillingSummary, computeBillingAnalytics, type InvoiceWithRelations } from "@/lib/queries/billing";
import { getSelectableClients } from "@/lib/queries/content";
import { getPaymentMethods } from "@/lib/queries/payment-methods";
import { NewPlanDialog } from "@/components/plans/new-plan-dialog";
import { EditPlanDialog } from "@/components/plans/edit-plan-dialog";
import { NewInvoiceDialog } from "@/components/billing/new-invoice-dialog";
import { InvoiceList } from "@/components/billing/invoice-list";
import { BillingDashboard } from "@/components/billing/billing-dashboard";
import { PaymentMethodsPanel } from "@/components/billing/payment-methods-panel";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { buildCsv, type CsvColumn } from "@/lib/export-csv";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Plan } from "@/types/database";
import { getT } from "@/lib/i18n/dictionary";

const INVOICE_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};

const INVOICE_CSV_COLUMNS: CsvColumn<InvoiceWithRelations>[] = [
  { header: "Cliente", value: (i) => i.client_name },
  { header: "Plan", value: (i) => i.plan_name },
  { header: "Proyecto web", value: (i) => i.web_project_title },
  { header: "Monto", value: (i) => i.amount },
  { header: "Moneda", value: (i) => i.currency },
  { header: "Estado", value: (i) => INVOICE_STATUS_LABEL[i.status] ?? i.status },
  { header: "Vencimiento", value: (i) => formatDate(i.due_date) },
  { header: "Pagada el", value: (i) => (i.paid_at ? formatDate(i.paid_at) : "") },
  { header: "Días de atraso", value: (i) => i.daysOverdue },
];

export default async function AdminPlanesPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const supabase = await createSupabaseServerClient();
  const [{ data: plans }, invoices, summary, clients, paymentMethods] = await Promise.all([
    supabase.from("plans").select("*").order("price_monthly"),
    getInvoices(),
    getBillingSummary(),
    getSelectableClients(),
    getPaymentMethods(),
  ]);

  const planOptions = (plans as Plan[] ?? []).map((p) => ({ id: p.id, name: p.name }));

  const currenciesInUse = Array.from(new Set(invoices.map((i) => i.currency)));
  const billingAnalytics = (currenciesInUse.length > 0 ? currenciesInUse : ["ARS"]).map((c) =>
    computeBillingAnalytics(invoices, c)
  );
  const invoicesCsv = buildCsv(INVOICE_CSV_COLUMNS, invoices);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("billing.pageTitle", "Planes y facturación")}
        description={t(
          "billing.pageDescription",
          "Información financiera — visible solo para vos (RLS bloquea a editores)."
        )}
      />

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">{t("billing.tabDashboard", "Dashboard")}</TabsTrigger>
          <TabsTrigger value="facturacion">{t("billing.tabFacturacion", "Facturación")}</TabsTrigger>
          <TabsTrigger value="planes">{t("billing.tabPlanes", "Planes")}</TabsTrigger>
          <TabsTrigger value="cobro">{t("billing.tabCobro", "Métodos de cobro")}</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <BillingDashboard analytics={billingAnalytics} language={profile.language} />
        </TabsContent>

        <TabsContent value="facturacion" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  {t("billing.kpiOpenInvoices", "Facturas abiertas")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold tabular-nums">
                {summary.pendingCount}
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  {t("billing.kpiOverdueCount", "Atrasadas")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold tabular-nums">
                {summary.overdueCount}
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  {t("billing.kpiDelinquentCount", "Morosos (15d+)")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold tabular-nums">
                {summary.delinquentCount}
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  {t("billing.kpiPending", "Monto pendiente")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold tabular-nums">
                {formatCurrency(summary.pendingTotal)}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-end gap-2">
            <ExportCsvButton filename="facturas.csv" csv={invoicesCsv} disabled={invoices.length === 0} />
            <NewInvoiceDialog clients={clients} plans={planOptions} />
          </div>

          <Card className="glass-card">
            <CardContent>
              <InvoiceList invoices={invoices} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planes" className="space-y-4">
          <div className="flex items-center justify-end">
            <NewPlanDialog />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(plans as Plan[] ?? []).map((plan) => (
              <Card key={plan.id} className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-1">
                      {plan.name}
                      <EditPlanDialog plan={plan} />
                    </span>
                    <span className="tabular-nums text-lg">
                      {formatCurrency(plan.price_monthly, plan.currency)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                  {plan.monthly_quota != null && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {plan.monthly_quota} {t("billing.videosPerMonthSuffix", "videos por mes")}
                    </p>
                  )}
                  <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-4 text-xs">
                    {(plan.features ?? []).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cobro" className="space-y-4">
          <PaymentMethodsPanel methods={paymentMethods} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
