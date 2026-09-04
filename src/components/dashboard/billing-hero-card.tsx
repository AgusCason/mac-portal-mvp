import Link from "next/link";
import { Wallet, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/shared/mini-charts";
import { getInitials, formatCurrency, cn } from "@/lib/utils";

/** Compartido con `admin-dashboard.tsx` (avatares de "Cuentas recientes") —
 *  mismo lenguaje visual de iniciales con degradé que ya usaba esta card. */
export const INITIALS_GRADIENTS = [
  "from-primary/60 to-primary text-primary-foreground",
  "from-info/60 to-info text-info-foreground",
];

/**
 * Card grande de "Facturación mensual" — mismo patrón que `.billing-card`
 * del mockup de dashboard aprobado (ícono + título + metric + lista de
 * clientes con iniciales/badge/monto), con los clientes que más pagan HOY
 * (client_plans real, ordenados por precio) en vez de los 2 clientes de
 * ejemplo fijos del mockup.
 */
export function BillingHeroCard({
  monthlyRevenue,
  topClients,
  title,
  viewAllHref,
  viewAllLabel,
  dailyCollections,
  dailyCollectionsLabel,
}: {
  monthlyRevenue: number;
  topClients: { id: string; name: string; plan_name: string; price: number }[];
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  /** Cobros reales por día (últimos 14 días) — opcional: si no hay ningún
   *  cobro registrado en la ventana, no tiene sentido mostrar una línea
   *  siempre en cero. */
  dailyCollections?: number[];
  dailyCollectionsLabel?: string;
}) {
  const hasCollectionsTrend = (dailyCollections ?? []).some((v) => v > 0);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3">
          <div className="icon-chip">
            <Wallet className="size-4" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-semibold tracking-tight">{title}</p>
        </div>
        <Link
          href={viewAllHref}
          aria-label={viewAllLabel}
          className="border-border bg-accent/40 hover:bg-accent text-muted-foreground hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-150"
        >
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="tabular-nums text-4xl font-bold tracking-tighter">
            {formatCurrency(monthlyRevenue)}
          </p>
          {hasCollectionsTrend && (
            <>
              <Sparkline points={dailyCollections!} className="mt-3" />
              {dailyCollectionsLabel && (
                <p className="text-muted-foreground mt-1 text-[10.5px]">{dailyCollectionsLabel}</p>
              )}
            </>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {topClients.length === 0 && (
            <p className="text-muted-foreground text-sm">—</p>
          )}
          {topClients.map((c, i) => (
            <div
              key={c.id}
              className="border-border/60 bg-accent/30 flex items-center gap-3 rounded-xl border px-3 py-2.5"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-extrabold",
                  INITIALS_GRADIENTS[i % INITIALS_GRADIENTS.length]
                )}
              >
                {getInitials(c.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[13px] font-bold">
                  <span className="truncate">{c.name}</span>
                  <Badge variant="secondary" className="shrink-0 text-[9px]">
                    {c.plan_name}
                  </Badge>
                </div>
              </div>
              <strong className="shrink-0 text-[13px] tabular-nums">
                {formatCurrency(c.price)}
              </strong>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
