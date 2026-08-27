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
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";

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
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("nav.analytics.envios", "Envíos")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("pages.analyticsEnvios.description", "Reportes publicados y entregados a cada cliente, en orden cronológico.")}
        </p>
      </div>

      {reports.length === 0 && (
        <Card>
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
