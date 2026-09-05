import { requireRole } from "@/lib/auth";
import { getReports } from "@/lib/queries/reports";
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
import { Send, BarChart3 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

/** Últimos 6 meses calendario (incluye el actual), como "2026-09" -> "sep. 2026". */
function lastSixMonths(): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const fmt = new Intl.DateTimeFormat("es-AR", { month: "short", year: "numeric" });
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: fmt.format(d) });
  }
  return months;
}

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

/**
 * Analytics > Envíos — historial de reportes publicados (= entregados al
 * cliente), ordenado por fecha de publicación. Equivalente al log de
 * "Envíos" de MB Suite, sin necesidad de una tabla nueva: un reporte
 * publicado ES un envío en el modelo de MAC Portal.
 */
export default async function AnalyticsEnviosPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const reports = (await getReports({ status: "published" })).sort((a, b) => {
    const aDate = a.published_at ?? a.created_at;
    const bDate = b.published_at ?? b.created_at;
    return aDate < bDate ? 1 : -1;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.analytics.envios", "Envíos")}
        description={t("pages.analyticsEnvios.description", "Reportes publicados y entregados a cada cliente, en orden cronológico.")}
      />

      {reports.length > 0 && (() => {
        const months = lastSixMonths();
        const counts = new Map(months.map((m) => [m.key, 0]));
        for (const r of reports) {
          const date = r.published_at ?? r.created_at;
          const key = date.slice(0, 7);
          if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const max = Math.max(1, ...Array.from(counts.values()));
        return (
          <Card className="glass-card">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="icon-chip">
                <BarChart3 className="size-4" strokeWidth={1.75} />
              </div>
              <CardTitle>{t("pages.analyticsEnvios.byMonthTitle", "Envíos por mes")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {months.map((m) => {
                const value = counts.get(m.key) ?? 0;
                const widthPct = Math.max(4, Math.round((value / max) * 100));
                return (
                  <div key={m.key} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-[11.5px] font-semibold capitalize">{m.label}</span>
                    <div className="bg-accent/60 h-2 flex-1 overflow-hidden rounded-full">
                      <span className="bg-primary/80 block h-full rounded-full" style={{ width: `${widthPct}%` }} />
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums">{value}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })()}

      {reports.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Send className="text-muted-foreground size-8" strokeWidth={1.5} />
            <p className="text-sm font-medium">{t("pages.analyticsEnvios.empty", "Todavía no se publicó ningún reporte")}</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              {t(
                "pages.analyticsEnvios.emptyHint",
                "Cuando publiques un reporte desde Analytics > Reports, va a aparecer acá con su fecha de envío."
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {reports.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages.analyticsEnvios.client", "Cliente")}</TableHead>
                <TableHead>{t("pages.analyticsEnvios.report", "Reporte")}</TableHead>
                <TableHead>{t("pages.analyticsEnvios.period", "Período")}</TableHead>
                <TableHead>{t("pages.analyticsEnvios.platforms", "Plataformas")}</TableHead>
                <TableHead>{t("pages.analyticsEnvios.colSent", "Enviado")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.client_name}</TableCell>
                  <TableCell className="text-sm">{r.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {r.period_label ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.platforms.map((p) => (
                        <Badge key={p} variant="outline" className="text-[10px]">
                          {PLATFORM_LABEL[p] ?? p}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(r.published_at ?? r.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
