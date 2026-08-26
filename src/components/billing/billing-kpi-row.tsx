import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

import type { BillingKpis } from "@/lib/queries/billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";
import type { ProfileLanguage } from "@/types/database";

/** 12 puntos como máximo (spec de stat-tile); acá van hasta 6 meses. */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 20 - ((v - min) / range) * 20;
    return `${x},${y}`;
  });
  const last = pts[pts.length - 1].split(",").map(Number);

  return (
    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="mt-2 h-5 w-full overflow-visible">
      <polyline
        points={pts.join(" ")}
        fill="none"
        className="stroke-muted-foreground"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r={2} className="fill-primary" />
    </svg>
  );
}

function DeltaTag({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-muted-foreground text-xs">sin mes anterior</span>;
  }
  if (Math.abs(pct) < 0.5) {
    return (
      <span className="text-muted-foreground flex items-center gap-0.5 text-xs">
        <Minus className="size-3" /> igual que el mes pasado
      </span>
    );
  }
  const up = pct > 0;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        up ? "text-success" : "text-muted-foreground"
      )}
    >
      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {Math.abs(pct).toFixed(0)}% vs. mes anterior
    </span>
  );
}

function CollectionMeter({ pct }: { pct: number | null }) {
  const value = pct ?? 0;
  const severity = pct === null ? "muted" : value >= 80 ? "good" : value >= 40 ? "warn" : "bad";
  const fillClass =
    severity === "good" ? "bg-success" : severity === "warn" ? "bg-warning" : severity === "bad" ? "bg-destructive" : "bg-muted-foreground";
  const label = pct === null ? "Sin facturación este mes" : severity === "good" ? "Buena" : severity === "warn" ? "Regular" : "Baja";

  return (
    <div className="space-y-1.5">
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-[width]", fillClass)}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

export function BillingKpiRow({
  kpis,
  currency,
  language,
}: {
  kpis: BillingKpis;
  currency: string;
  language: ProfileLanguage;
}) {
  const t = getT(language);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-xs font-medium">
            {t("billing.kpiCurrentMonth", "Facturado este mes")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold tabular-nums">
            {formatCurrency(kpis.currentMonthTotal, currency)}
          </p>
          <DeltaTag pct={kpis.deltaPct} />
          <Sparkline values={kpis.sparkline} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-xs font-medium">
            {t("billing.kpiCollectionRate", "Tasa de cobro del mes")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold tabular-nums">
            {kpis.collectionRatePct === null ? "—" : `${kpis.collectionRatePct.toFixed(0)}%`}
          </p>
          <CollectionMeter pct={kpis.collectionRatePct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-xs font-medium">
            {t("billing.kpiPending", "Monto pendiente")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold tabular-nums">{formatCurrency(kpis.pendingTotal, currency)}</p>
          <p className="text-muted-foreground text-xs">Aún no vencido</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-xs font-medium">
            {t("billing.kpiOverdue", "Monto atrasado")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-xl font-semibold tabular-nums">
            {formatCurrency(kpis.overdueTotal, currency)}
          </p>
          <p className="text-muted-foreground text-xs">
            {kpis.overdueCount} {kpis.overdueCount === 1 ? "factura" : "facturas"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
