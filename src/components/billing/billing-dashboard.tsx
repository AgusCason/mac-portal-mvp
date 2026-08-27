"use client";

import * as React from "react";

import type { BillingAnalytics } from "@/lib/queries/billing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BillingKpiRow } from "@/components/billing/billing-kpi-row";
import { MonthlyBillingChart } from "@/components/billing/monthly-billing-chart";
import { PaymentMethodChart } from "@/components/billing/payment-method-chart";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";
import type { ProfileLanguage } from "@/types/database";

export function BillingDashboard({
  analytics,
  language,
}: {
  /** Una entrada por moneda con facturas (ver page.tsx). Siempre >= 1. */
  analytics: BillingAnalytics[];
  language: ProfileLanguage;
}) {
  const t = getT(language);
  const [currency, setCurrency] = React.useState(analytics[0].currency);
  const current = analytics.find((a) => a.currency === currency) ?? analytics[0];

  return (
    <div className="space-y-4">
      {analytics.length > 1 && (
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
          {analytics.map((a) => (
            <button
              key={a.currency}
              type="button"
              onClick={() => setCurrency(a.currency)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                a.currency === currency
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {a.currency}
            </button>
          ))}
        </div>
      )}

      {!current.hasData ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            {t("billing.noInvoicesInCurrencyPrefix", "Todavía no hay facturas en")} {current.currency}.
          </CardContent>
        </Card>
      ) : (
        <>
          <BillingKpiRow kpis={current.kpis} currency={current.currency} language={language} />

          <Card>
            <CardHeader>
              <CardTitle>{t("billing.monthlyChartTitle", "Facturación mensual")}</CardTitle>
              <CardDescription>
                {t("billing.monthlyBreakdownPrefix", "Monto emitido por mes, últimos")} {current.monthly.length}{" "}
                {t("billing.monthlyBreakdownSuffix", "meses — apilado por estado.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyBillingChart data={current.monthly} currency={current.currency} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("billing.methodChartTitle", "Método de pago")}</CardTitle>
              <CardDescription>{t("billing.methodChartDescription", "Monto total facturado por método, histórico.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentMethodChart data={current.methods} currency={current.currency} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
