"use client";

import * as React from "react";
import { Table2, LayoutGrid } from "lucide-react";

import type { PaymentMethodPoint } from "@/lib/queries/billing";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";

/**
 * Monto facturado por método de pago, de mayor a menor.
 *
 * Es una comparación de magnitud entre categorías nominales (no hay un
 * "método 1, método 2..." con identidad propia que deba distinguirse por
 * color) — un solo color (acento primario) alcanza; el orden ya comunica
 * el ranking, así que no hace falta leyenda.
 */
export function PaymentMethodChart({
  data,
  currency,
}: {
  data: PaymentMethodPoint[];
  currency: string;
}) {
  const [showTable, setShowTable] = React.useState(false);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => setShowTable((v) => !v)}>
          {showTable ? <LayoutGrid /> : <Table2 />}
          {showTable ? "Ver gráfico" : "Ver tabla"}
        </Button>
      </div>

      {data.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          Todavía no hay facturas en {currency} para mostrar.
        </p>
      ) : showTable ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Facturas</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.method}>
                  <TableCell className="text-muted-foreground">{d.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.count}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(d.total, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.map((d, i) => (
            <div key={d.method} className="flex items-center gap-3">
              <span className="text-muted-foreground w-24 shrink-0 truncate text-xs">{d.label}</span>
              <div className="relative min-w-0 flex-1">
                <div
                  tabIndex={0}
                  aria-label={`${d.label}: ${formatCurrency(d.total, currency)}, ${d.count} facturas`}
                  className={cn(
                    "bg-primary h-4 rounded-r-[4px] outline-none transition-opacity",
                    hoverIdx !== null && hoverIdx !== i && "opacity-60"
                  )}
                  style={{ width: `${Math.max((d.total / max) * 100, 2)}%` }}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onFocus={() => setHoverIdx(i)}
                  onBlur={() => setHoverIdx(null)}
                />
                {hoverIdx === i && (
                  <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-max rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
                    <p className="text-popover-foreground tabular-nums">
                      <span className="font-semibold">{formatCurrency(d.total, currency)}</span>{" "}
                      <span className="text-muted-foreground">{d.label}</span>
                    </p>
                    <p className="text-muted-foreground">{d.count} facturas</p>
                  </div>
                )}
              </div>
              <span className="w-28 shrink-0 text-right text-xs font-medium tabular-nums">
                {formatCurrency(d.total, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
