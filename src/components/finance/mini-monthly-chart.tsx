"use client";

import * as React from "react";
import { cn, formatCurrency, formatCompactCurrency, niceScaleMax } from "@/lib/utils";

/**
 * Gráfico de barras apiladas mensual, compacto — misma idea que
 * `MonthlyBillingChart` (components/billing/monthly-billing-chart.tsx) pero
 * genérico en los segmentos y sin el toggle de tabla, para caber en el
 * dashboard general de Finanzas junto a otros dos gráficos. Sirve tanto
 * para "Pago Clientes" (cobrado/pendiente/atrasado) como para "Pago Editor"
 * (pagado/pendiente) pasándole distintos `segments`.
 */

export interface MiniChartSegmentDef {
  key: string;
  label: string;
  barClass: string;
  dotClass: string;
}

export interface MiniChartPoint {
  /** Clave única del punto (ej. "2026-08") */
  key: string;
  label: string;
  values: Record<string, number>;
  total: number;
}

export function MiniMonthlyChart({
  data,
  segments,
  currency,
}: {
  data: MiniChartPoint[];
  segments: MiniChartSegmentDef[];
  currency: string;
}) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  const PLOT_H = 120;
  const TICK_COL_W = 40;

  const max = niceScaleMax(Math.max(...data.map((d) => d.total), 1));
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  const scaleY = (v: number) => (v / max) * PLOT_H;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-3">
        {segments.map((s) => (
          <div key={s.key} className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span className={cn("size-2 rounded-full", s.dotClass)} />
            {s.label}
          </div>
        ))}
      </div>

      <div className="relative" style={{ height: PLOT_H, paddingLeft: TICK_COL_W }}>
        {ticks.map((tick) => (
          <div
            key={tick}
            className="absolute right-0 flex items-center gap-2"
            style={{ left: 0, bottom: scaleY(tick) }}
          >
            <span
              className="text-muted-foreground shrink-0 text-right tabular-nums"
              style={{ width: TICK_COL_W - 8, fontSize: 10 }}
            >
              {formatCompactCurrency(tick, currency)}
            </span>
            <div className="border-border h-0 flex-1 border-t" />
          </div>
        ))}

        <div className="absolute inset-y-0 right-0 flex items-end gap-1" style={{ left: TICK_COL_W }}>
          {data.map((d, i) => {
            const lastVisibleIdx = segments.reduce(
              (acc, s, idx) => ((d.values[s.key] ?? 0) > 0 ? idx : acc),
              -1
            );
            return (
              <div
                key={d.key}
                className="relative flex flex-1 flex-col-reverse items-center justify-start gap-0.5"
                style={{ height: PLOT_H }}
              >
                {segments.map((s, idx) => {
                  const value = d.values[s.key] ?? 0;
                  const h = scaleY(value);
                  if (h <= 0) return null;
                  return (
                    <div
                      key={s.key}
                      tabIndex={0}
                      aria-label={`${s.label} ${d.label}: ${formatCurrency(value, currency)}`}
                      className={cn(
                        "w-full max-w-6 outline-none",
                        s.barClass,
                        idx === lastVisibleIdx && "rounded-t-[4px]",
                        hoverIdx !== null && hoverIdx !== i && "opacity-40"
                      )}
                      style={{ height: h }}
                      onMouseEnter={() => setHoverIdx(i)}
                      onMouseLeave={() => setHoverIdx(null)}
                      onFocus={() => setHoverIdx(i)}
                      onBlur={() => setHoverIdx(null)}
                    />
                  );
                })}

                {hoverIdx === i && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
                    <p className="text-popover-foreground font-medium">{d.label}</p>
                    {segments
                      .filter((s) => (d.values[s.key] ?? 0) > 0)
                      .map((s) => (
                        <p key={s.key} className="flex items-center gap-1.5 tabular-nums">
                          <span className={cn("size-1.5 rounded-full", s.dotClass)} />
                          <span className="text-popover-foreground font-semibold">
                            {formatCurrency(d.values[s.key] ?? 0, currency)}
                          </span>
                          <span className="text-muted-foreground">{s.label}</span>
                        </p>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-1" style={{ paddingLeft: TICK_COL_W }}>
        {data.map((d) => (
          <span key={d.key} className="text-muted-foreground flex-1 truncate text-center" style={{ fontSize: 10 }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
