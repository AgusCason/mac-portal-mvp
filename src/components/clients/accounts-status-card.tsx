import { PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutMini } from "@/components/shared/mini-charts";
import type { AccountCardData } from "@/lib/queries/clients";

/**
 * Donut real de "Cuentas por estado" (activa/pausada/perdida) + mix de
 * planes — antes esta info solo existía implícita en el "· N activas de M"
 * del título de la página, sin forma de ver de un vistazo cuántas están
 * pausadas o perdidas ni qué tan repartidos están los planes. Mismo
 * lenguaje visual que `AccountsHeroCard` del Dashboard, con datos propios
 * de esta lista (no repite los mismos números).
 */
export function AccountsStatusCard({
  accounts,
  title,
  statusLabels,
  centerLabel,
  planMixEmptyLabel,
}: {
  accounts: AccountCardData[];
  title: string;
  statusLabels: { active: string; paused: string; churned: string };
  centerLabel: string;
  planMixEmptyLabel: string;
}) {
  const counts = { active: 0, paused: 0, churned: 0 };
  for (const a of accounts) {
    if (a.status in counts) counts[a.status as keyof typeof counts] += 1;
  }

  const planCounts = new Map<string, number>();
  for (const a of accounts) {
    const name = a.planName ?? "—";
    planCounts.set(name, (planCounts.get(name) ?? 0) + 1);
  }
  const totalWithPlan = accounts.filter((a) => a.planName).length;
  const planMix = Array.from(planCounts.entries())
    .filter(([name]) => name !== "—")
    .map(([name, count]) => ({
      name,
      count,
      pct: totalWithPlan > 0 ? Math.round((count / totalWithPlan) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const DOT_COLORS = ["bg-primary", "bg-info", "bg-foreground/40", "bg-muted-foreground/60"];

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="icon-chip">
          <PieChart className="size-4" strokeWidth={1.75} />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-around">
        <DonutMini
          segments={[
            { label: statusLabels.active, value: counts.active, color: "var(--success)" },
            { label: statusLabels.paused, value: counts.paused, color: "var(--warning)" },
            { label: statusLabels.churned, value: counts.churned, color: "var(--destructive)" },
          ]}
          centerValue={accounts.length}
          centerLabel={centerLabel}
        />
        <div className="flex w-full flex-col gap-2 sm:max-w-[220px]">
          <div className="flex items-center gap-2 text-xs">
            <span className="size-2 shrink-0 rounded-full" style={{ background: "var(--success)" }} />
            <span className="text-muted-foreground flex-1">{statusLabels.active}</span>
            <strong className="tabular-nums">{counts.active}</strong>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="size-2 shrink-0 rounded-full" style={{ background: "var(--warning)" }} />
            <span className="text-muted-foreground flex-1">{statusLabels.paused}</span>
            <strong className="tabular-nums">{counts.paused}</strong>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="size-2 shrink-0 rounded-full" style={{ background: "var(--destructive)" }} />
            <span className="text-muted-foreground flex-1">{statusLabels.churned}</span>
            <strong className="tabular-nums">{counts.churned}</strong>
          </div>
          {planMix.length > 0 && (
            <div className="border-border/60 mt-2 flex flex-col gap-1.5 border-t pt-2.5">
              {planMix.map((plan, i) => (
                <div key={plan.name} className="flex items-center gap-2 text-xs">
                  <span className={`size-2 shrink-0 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`} />
                  <span className="text-muted-foreground flex-1 truncate">{plan.name}</span>
                  <strong className="tabular-nums">{plan.pct}%</strong>
                </div>
              ))}
            </div>
          )}
          {planMix.length === 0 && (
            <p className="text-muted-foreground mt-1 text-xs">{planMixEmptyLabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
