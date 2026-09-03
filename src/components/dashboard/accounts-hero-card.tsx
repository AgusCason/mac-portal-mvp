import Link from "next/link";
import { Users, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const DOT_COLORS = ["bg-primary", "bg-info", "bg-foreground/40", "bg-muted-foreground/60"];
const STROKE_COLORS = ["var(--primary)", "var(--info)", "var(--foreground)", "var(--muted-foreground)"];

const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Card grande de "Cuentas activas" — última iteración del mockup aprobado:
 * el gráfico (donut) arriba, la leyenda de planes abajo ocupando todo el
 * alto de la card (sin el "3/3" que dejaba un hueco vacío al lado del
 * gráfico — ver charla). El crecimiento sale de clientes activos dados de
 * alta este mes calendario (no hay snapshots históricos para un delta más
 * fino) y el mix de planes sale de client_plans real.
 */
export function AccountsHeroCard({
  activeClients,
  newClientsThisMonth,
  planMix,
  title,
  activeLabel,
  newThisMonthLabel,
  viewAllHref,
  viewAllLabel,
  planMixEmptyLabel,
}: {
  activeClients: number;
  newClientsThisMonth: number;
  planMix: { name: string; count: number; pct: number }[];
  title: string;
  activeLabel: string;
  newThisMonthLabel: (n: number) => string;
  viewAllHref: string;
  viewAllLabel: string;
  planMixEmptyLabel: string;
}) {
  const segmentLengths = planMix.map(
    (plan) => (Math.max(0, Math.min(100, plan.pct)) / 100) * CIRCUMFERENCE
  );
  const segments = planMix.map((plan, i) => ({
    name: plan.name,
    color: STROKE_COLORS[i % STROKE_COLORS.length],
    dasharray: `${segmentLengths[i]} ${CIRCUMFERENCE}`,
    dashoffset: -segmentLengths.slice(0, i).reduce((sum, len) => sum + len, 0),
  }));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3">
          <div className="icon-chip">
            <Users className="size-4" strokeWidth={1.75} />
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
      <CardContent className="flex flex-1 flex-col items-center justify-between gap-5 pt-1">
        {newClientsThisMonth > 0 ? (
          <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold">
            <TrendingUp className="size-3.5" strokeWidth={2} />
            {newThisMonthLabel(newClientsThisMonth)}
          </span>
        ) : (
          <span />
        )}

        {planMix.length === 0 ? (
          <p className="text-muted-foreground text-sm">{planMixEmptyLabel}</p>
        ) : (
          <div className="relative size-[140px] shrink-0">
            <svg viewBox="0 0 140 140" className="size-full -rotate-90">
              <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="14" />
              {segments.map((segment) => (
                <circle
                  key={segment.name}
                  cx="70"
                  cy="70"
                  r={RADIUS}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="14"
                  strokeDasharray={segment.dasharray}
                  strokeDashoffset={segment.dashoffset}
                  strokeLinecap="round"
                />
              ))}
            </svg>
            <div className="bg-card absolute inset-5 flex flex-col items-center justify-center rounded-full">
              <strong className="text-2xl font-extrabold tracking-tighter">{activeClients}</strong>
              <span className="text-muted-foreground text-[9px] font-semibold tracking-wide uppercase">
                {activeLabel}
              </span>
            </div>
          </div>
        )}

        {planMix.length > 0 && (
          <div className="flex w-full flex-col gap-2.5">
            {planMix.map((plan, i) => (
              <div
                key={plan.name}
                className="border-border/60 bg-accent/30 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5"
              >
                <span className={`size-2 shrink-0 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`} />
                <span className="text-muted-foreground truncate text-[12.5px]">{plan.name}</span>
                <strong className="ml-auto shrink-0 text-[13px] tabular-nums">{plan.pct}%</strong>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
