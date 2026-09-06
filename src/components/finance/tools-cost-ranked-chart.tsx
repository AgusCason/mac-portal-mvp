"use client";

import * as React from "react";
import type { ToolCostBreakdownRow } from "@/lib/finance-utils";
import { cn, formatCurrency } from "@/lib/utils";

/**
 * Ranking de herramientas por costo mensual — misma idea que
 * `PaymentMethodChart` (components/billing/payment-method-chart.tsx):
 * barras horizontales, un solo color (el orden ya comunica el ranking), sin
 * necesidad de leyenda. No hay eje de tiempo acá (el costo de una
 * herramienta no tiene historial, solo el valor cargado hoy), así que es
 * una comparación de magnitud entre herramientas, no una serie temporal.
 */
export function ToolsCostRankedChart({ rows, currency }: { rows: ToolCostBreakdownRow[]; currency: string }) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const max = Math.max(...rows.map((r) => r.monthlyEquivalent), 1);
  const visible = rows.slice(0, 8);

  return (
    <div className="space-y-2.5">
      {visible.map((row, i) => (
        <div key={row.toolId} className="flex items-center gap-3">
          <span className="text-muted-foreground w-24 shrink-0 truncate text-xs">{row.name}</span>
          <div className="relative min-w-0 flex-1">
            <div
              tabIndex={0}
              aria-label={`${row.name}: ${formatCurrency(row.monthlyEquivalent, currency)} por mes`}
              className={cn(
                "bg-primary h-4 rounded-r-[4px] outline-none transition-opacity",
                hoverIdx !== null && hoverIdx !== i && "opacity-60"
              )}
              style={{ width: `${Math.max((row.monthlyEquivalent / max) * 100, 2)}%` }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onFocus={() => setHoverIdx(i)}
              onBlur={() => setHoverIdx(null)}
            />
            {hoverIdx === i && (
              <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-max rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
                <p className="text-popover-foreground tabular-nums font-semibold">
                  {formatCurrency(row.monthlyEquivalent, currency)}
                </p>
                <p className="text-muted-foreground">{row.name}</p>
              </div>
            )}
          </div>
          <span className="w-24 shrink-0 text-right text-xs font-medium tabular-nums">
            {formatCurrency(row.monthlyEquivalent, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}
