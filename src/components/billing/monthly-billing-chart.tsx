"use client";

import * as React from "react";
import { Table2, LayoutGrid } from "lucide-react";

import type { MonthlyBillingPoint } from "@/lib/queries/billing";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatCompactCurrency, niceScaleMax } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/dictionary";

const DATE_LOCALE: Record<Locale, string> = { es: "es-AR", en: "en-US" };

/** Recalcula el label del mes en el idioma del viewer a partir de `month` ("2026-08"), ignorando `d.label` (que siempre viene en español desde el server). */
function monthDisplayLabel(monthKey: string, spansYears: boolean, locale: Locale): string {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  const base = new Intl.DateTimeFormat(DATE_LOCALE[locale], { month: "short" }).format(d).replace(".", "");
  const cap = base.charAt(0).toUpperCase() + base.slice(1);
  return spansYears ? `${cap} ${String(year).slice(2)}` : cap;
}

/**
 * Facturación mensual apilada por estado.
 *
 * El pedido original era un "gráfico de torta" para los montos mensuales,
 * pero un pie no sirve para series de tiempo: pierde el orden de los meses,
 * y con 12 meses en pantalla el mismo pedido de "comparar meses" queda
 * imposible de leer en gajos. Una barra apilada muestra el monto total del
 * mes (alto de la barra), la composición por estado (color) y la
 * comparación entre meses (posición) en un solo gráfico — cubre "monto
 * mensual" + "comparativa de los meses" a la vez.
 *
 * Orden de apilado (pagado → pendiente → atrasado → cancelado) es fijo:
 * valida contra colorblind-safety (validate_palette.js) sin que rojo y
 * verde queden lado a lado.
 */

type SegmentKey = "paid" | "pending" | "overdue" | "cancelled";

export function MonthlyBillingChart({
  data,
  currency,
}: {
  data: MonthlyBillingPoint[];
  currency: string;
}) {
  const { t, locale } = useLocale();
  const [showTable, setShowTable] = React.useState(false);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  const spansYears =
    data.length > 0 &&
    data[0].month.slice(0, 4) !== data[data.length - 1].month.slice(0, 4);
  const labels = React.useMemo(
    () => new Map(data.map((d) => [d.month, monthDisplayLabel(d.month, spansYears, locale)])),
    [data, spansYears, locale]
  );

  const SEGMENTS: { key: SegmentKey; label: string; barClass: string; dotClass: string }[] = [
    { key: "paid", label: t("billing.segPaid", "Pagado"), barClass: "bg-success", dotClass: "bg-success" },
    { key: "pending", label: t("billing.segPending", "Pendiente"), barClass: "bg-primary", dotClass: "bg-primary" },
    {
      key: "overdue",
      label: t("billing.segOverdue", "Atrasado"),
      barClass: "bg-destructive",
      dotClass: "bg-destructive",
    },
    {
      key: "cancelled",
      label: t("billing.segCancelled", "Cancelado"),
      barClass: "bg-muted-foreground",
      dotClass: "bg-muted-foreground",
    },
  ];

  const PLOT_H = 176; // alto del área de trazado en px
  const TICK_COL_W = 44; // ancho reservado para las etiquetas del eje Y

  const max = niceScaleMax(Math.max(...data.map((d) => d.total), 1));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const scaleY = (v: number) => (v / max) * PLOT_H;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {SEGMENTS.map((s) => (
            <div key={s.key} className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span className={cn("size-2 rounded-full", s.dotClass)} />
              {s.label}
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowTable((v) => !v)}>
          {showTable ? <LayoutGrid /> : <Table2 />}
          {showTable ? t("billing.viewChart", "Ver gráfico") : t("billing.viewTable", "Ver tabla")}
        </Button>
      </div>

      {showTable ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("billing.colMonth", "Mes")}</TableHead>
                <TableHead className="text-right">{t("billing.segPaid", "Pagado")}</TableHead>
                <TableHead className="text-right">{t("billing.segPending", "Pendiente")}</TableHead>
                <TableHead className="text-right">{t("billing.segOverdue", "Atrasado")}</TableHead>
                <TableHead className="text-right">{t("billing.segCancelled", "Cancelado")}</TableHead>
                <TableHead className="text-right">{t("billing.colTotal", "Total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.month}>
                  <TableCell className="text-muted-foreground">{labels.get(d.month)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(d.paid, currency)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(d.pending, currency)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(d.overdue, currency)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(d.cancelled, currency)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(d.total, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div>
          <div className="relative" style={{ height: PLOT_H, paddingLeft: TICK_COL_W }}>
            {/* Gridlines + etiquetas del eje Y — hairline, recesivas */}
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

            {/* Barras */}
            <div className="absolute inset-y-0 right-0 flex items-end gap-1" style={{ left: TICK_COL_W }}>
              {data.map((d, i) => {
                const lastVisibleIdx = SEGMENTS.reduce(
                  (acc, s, idx) => (d[s.key] > 0 ? idx : acc),
                  -1
                );
                const monthLabel = labels.get(d.month) ?? d.label;
                return (
                  <div
                    key={d.month}
                    className="relative flex flex-1 flex-col-reverse items-center justify-start gap-0.5"
                    style={{ height: PLOT_H }}
                  >
                    {SEGMENTS.map((s, idx) => {
                      const h = scaleY(d[s.key]);
                      if (h <= 0) return null;
                      return (
                        <div
                          key={s.key}
                          tabIndex={0}
                          aria-label={`${s.label} ${monthLabel}: ${formatCurrency(d[s.key], currency)}`}
                          className={cn(
                            "w-6 outline-none",
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
                        <p className="text-popover-foreground font-medium">{monthLabel}</p>
                        {SEGMENTS.filter((s) => d[s.key] > 0).map((s) => (
                          <p key={s.key} className="flex items-center gap-1.5 tabular-nums">
                            <span className={cn("size-1.5 rounded-full", s.dotClass)} />
                            <span className="text-popover-foreground font-semibold">
                              {formatCurrency(d[s.key], currency)}
                            </span>
                            <span className="text-muted-foreground">{s.label}</span>
                          </p>
                        ))}
                        <p className="text-muted-foreground mt-0.5 border-t border-border pt-0.5">
                          {t("billing.totalPrefix", "Total:")}{" "}
                          <span className="text-popover-foreground font-medium">{formatCurrency(d.total, currency)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-1" style={{ paddingLeft: TICK_COL_W }}>
            {data.map((d) => (
              <span
                key={d.month}
                className="text-muted-foreground flex-1 truncate text-center"
                style={{ fontSize: 10 }}
              >
                {labels.get(d.month)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
