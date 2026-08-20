import { requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getInvoices, getBillingSummary } from "@/lib/queries/billing";
import { getSelectableClients } from "@/lib/queries/content";
import { NewPlanDialog } from "@/components/plans/new-plan-dialog";
import { NewInvoiceDialog } from "@/components/billing/new-invoice-dialog";
import { InvoiceList } from "@/components/billing/invoice-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import type { Plan } from "@/types/database";

export default async function AdminPlanesPage() {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();
  const [{ data: plans }, invoices, summary, clients] = await Promise.all([
    supabase.from("plans").select("*").order("price_monthly"),
    getInvoices(),
    getBillingSummary(),
    getSelectableClients(),
  ]);

  const planOptions = (plans as Plan[] ?? []).map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Planes y facturación</h1>
        <p className="text-muted-foreground text-sm">
          Información financiera — visible solo para vos (RLS bloquea a editores).
        </p>
      </div>

      <Tabs defaultValue="facturacion">
        <TabsList>
          <TabsTrigger value="facturacion">Facturación</TabsTrigger>
          <TabsTrigger value="planes">Planes</TabsTrigger>
        </TabsList>

        <TabsContent value="facturacion" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  Facturas abiertas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold tabular-nums">
                {summary.pendingCount}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  Atrasadas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold tabular-nums">
                {summary.overdueCount}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  Morosos (15d+)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold tabular-nums">
                {summary.delinquentCount}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  Monto pendiente
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold tabular-nums">
                {formatCurrency(summary.pendingTotal)}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-end">
            <NewInvoiceDialog clients={clients} plans={planOptions} />
          </div>

          <Card>
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
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="flex items-baseline justify-between">
                    <span>{plan.name}</span>
                    <span className="tabular-nums text-lg">
                      {formatCurrency(plan.price_monthly, plan.currency)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                  {plan.monthly_quota != null && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {plan.monthly_quota} videos por mes
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
      </Tabs>
    </div>
  );
}
