import { requireRole } from "@/lib/auth";
import { getAllMetricAlerts } from "@/lib/queries/analytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutMini } from "@/components/shared/mini-charts";
import { TrendingDown, PieChart } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Analytics > Alertas — historial completo de caídas de métricas (Fase 3.4),
 * equivalente a lo que MB Suite muestra bajo Analytics > Alertas.
 */
export default async function AnalyticsAlertasPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const alerts = await getAllMetricAlerts();

  const METRIC_LABELS: Record<string, string> = {
    reach: t("pages.redes.reach", "Alcance"),
    followers: t("pages.redes.followers", "Seguidores"),
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.analyticsAlertas.title", "Alertas de métricas")}
        description={t(
          "pages.analyticsAlertas.description",
          "Caídas de 30% o más en alcance o seguidores vs. el promedio de los días previos."
        )}
      />

      {alerts.length > 0 && (() => {
        const reachCount = alerts.filter((a) => a.metricType === "reach").length;
        const followersCount = alerts.filter((a) => a.metricType === "followers").length;
        const avgDrop = Math.round(
          (alerts.reduce((sum, a) => sum + a.dropPct, 0) / alerts.length) * 100
        );
        return (
          <Card className="glass-card">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="icon-chip">
                <PieChart className="size-4" strokeWidth={1.75} />
              </div>
              <CardTitle>{t("pages.analyticsAlertas.byMetricTitle", "Alertas por métrica")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around">
              <DonutMini
                segments={[
                  { label: t("pages.redes.reach", "Alcance"), value: reachCount, color: "var(--info)" },
                  { label: t("pages.redes.followers", "Seguidores"), value: followersCount, color: "var(--destructive)" },
                ]}
                centerValue={alerts.length}
                centerLabel={t("pages.analyticsAlertas.centerLabel", "alertas")}
              />
              <div className="flex w-full flex-col gap-2 sm:max-w-[220px]">
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: "var(--info)" }} />
                  <span className="text-muted-foreground flex-1">{t("pages.redes.reach", "Alcance")}</span>
                  <strong className="tabular-nums">{reachCount}</strong>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: "var(--destructive)" }} />
                  <span className="text-muted-foreground flex-1">{t("pages.redes.followers", "Seguidores")}</span>
                  <strong className="tabular-nums">{followersCount}</strong>
                </div>
                <div className="border-border/60 mt-2 flex items-center gap-2 border-t pt-2.5 text-xs">
                  <span className="text-muted-foreground flex-1">{t("pages.analyticsAlertas.avgDrop", "Caída promedio")}</span>
                  <strong className="tabular-nums">-{avgDrop}%</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {alerts.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <TrendingDown className="text-muted-foreground size-8" strokeWidth={1.5} />
            <p className="text-sm font-medium">{t("pages.analyticsAlertas.empty", "Sin caídas detectadas por ahora")}</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              {t(
                "pages.analyticsAlertas.emptyHint",
                "El cron diario revisa todas las cuentas conectadas y va a avisar acá apenas detecte una."
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {alerts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages.analyticsAlertas.account", "Cuenta")}</TableHead>
                <TableHead>{t("pages.analyticsAlertas.metric", "Métrica")}</TableHead>
                <TableHead className="text-right">{t("pages.analyticsAlertas.previousAvg", "Promedio previo")}</TableHead>
                <TableHead className="text-right">{t("pages.analyticsAlertas.value", "Valor")}</TableHead>
                <TableHead className="text-right">{t("pages.analyticsAlertas.colDrop", "Caída")}</TableHead>
                <TableHead>{t("pages.analyticsAlertas.colDate", "Fecha")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.clientName}</TableCell>
                  <TableCell className="text-sm">
                    {METRIC_LABELS[a.metricType] ?? a.metricType}
                  </TableCell>
                  <TableCell className="tabular-nums text-right">
                    {a.previousAvg.toLocaleString("es-AR")}
                  </TableCell>
                  <TableCell className="tabular-nums text-right">
                    {a.currentValue.toLocaleString("es-AR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="destructive">-{Math.round(a.dropPct * 100)}%</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(a.metricDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
