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
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";
import { formatDate } from "@/lib/utils";
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
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("pages.analyticsAlertas.title", "Alertas de métricas")}</h1>
        <p className="text-muted-foreground text-sm">
          Caídas de 30% o más en alcance o seguidores vs. el promedio de los días previos.
        </p>
      </div>

      {alerts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <TrendingDown className="text-muted-foreground size-8" strokeWidth={1.5} />
            <p className="text-sm font-medium">{t("pages.analyticsAlertas.empty", "Sin caídas detectadas por ahora")}</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              El cron diario revisa todas las cuentas conectadas y va a avisar acá apenas detecte una.
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
                <TableHead className="text-right">Caída</TableHead>
                <TableHead>Fecha</TableHead>
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
