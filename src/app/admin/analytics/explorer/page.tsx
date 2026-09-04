import { requireRole } from "@/lib/auth";
import { getExplorerRows, type ExplorerRow } from "@/lib/queries/analytics";
import { getSelectableClients } from "@/lib/queries/content";
import { ExplorerFilters } from "@/components/analytics/explorer-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { buildCsv, type CsvColumn } from "@/lib/export-csv";
import { formatDate } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";
import type { SocialPlatform } from "@/types/database";

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

// Exporta EXACTAMENTE lo que está filtrado (cliente/plataforma/días) — así
// sirve tanto para "métricas totales" (sin filtro) como para "métricas de
// un cliente puntual" (con ?cliente=), sin necesitar dos botones distintos.
const EXPLORER_CSV_COLUMNS: CsvColumn<ExplorerRow>[] = [
  { header: "Fecha", value: (r) => formatDate(r.metricDate) },
  { header: "Cliente", value: (r) => r.clientName },
  { header: "Cuenta", value: (r) => r.accountName },
  { header: "Plataforma", value: (r) => PLATFORM_LABEL[r.platform] },
  { header: "Alcance", value: (r) => r.reach },
  { header: "Impresiones", value: (r) => r.impressions },
  { header: "Engagement %", value: (r) => r.engagementRate },
  { header: "Seguidores", value: (r) => r.followers },
  { header: "Reproducciones", value: (r) => r.plays },
];

/**
 * Analytics > Explorer — equivalente a `/demo-agency/analytics/explorer` de
 * MB Suite: tabla plana y filtrable de todas las métricas diarias cargadas,
 * cruzando cuenta + cliente. Filtros sincronizados con la URL.
 */
export default async function AnalyticsExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; plataforma?: string; dias?: string }>;
}) {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const { cliente, plataforma, dias } = await searchParams;
  const [clients, rows] = await Promise.all([
    getSelectableClients(),
    getExplorerRows({
      clientId: cliente,
      platform: plataforma as SocialPlatform | undefined,
      days: dias ? Number(dias) : undefined,
    }),
  ]);
  const explorerCsv = buildCsv(EXPLORER_CSV_COLUMNS, rows);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("nav.analytics.explorer", "Explorer")}</h1>
          <p className="text-muted-foreground text-sm">
            {rows.length}{" "}
            {rows.length === 1
              ? t("pages.analyticsExplorer.rowSingular", "fila")
              : t("pages.analyticsExplorer.rowPlural", "filas")}{" "}
            {t("pages.analyticsExplorer.rowsSuffix", "de métricas diarias.")}
          </p>
        </div>
        <ExportCsvButton filename="metricas.csv" csv={explorerCsv} disabled={rows.length === 0} />
      </div>

      <ExplorerFilters clients={clients} />

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("pages.analyticsExplorer.date", "Fecha")}</TableHead>
              <TableHead>{t("pages.analyticsExplorer.account", "Cuenta")}</TableHead>
              <TableHead>{t("pages.analyticsExplorer.platform", "Plataforma")}</TableHead>
              <TableHead className="text-right">{t("pages.analyticsExplorer.reach", "Alcance")}</TableHead>
              <TableHead className="text-right">{t("pages.analyticsExplorer.impressions", "Impresiones")}</TableHead>
              <TableHead className="text-right">{t("pages.analyticsExplorer.engagement", "Engagement")}</TableHead>
              <TableHead className="text-right">{t("pages.redes.followers", "Seguidores")}</TableHead>
              <TableHead className="text-right">{t("pages.redes.plays", "Reproducciones")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="tabular-nums text-sm">{formatDate(r.metricDate)}</TableCell>
                <TableCell className="text-sm">
                  <p className="font-medium">{r.clientName}</p>
                  {r.accountName && <p className="text-muted-foreground text-xs">{r.accountName}</p>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{PLATFORM_LABEL[r.platform]}</Badge>
                </TableCell>
                <TableCell className="tabular-nums text-right">{r.reach.toLocaleString("es-AR")}</TableCell>
                <TableCell className="tabular-nums text-right">
                  {r.impressions.toLocaleString("es-AR")}
                </TableCell>
                <TableCell className="tabular-nums text-right">{r.engagementRate.toFixed(2)}%</TableCell>
                <TableCell className="tabular-nums text-right">
                  {r.followers.toLocaleString("es-AR")}
                </TableCell>
                <TableCell className="tabular-nums text-right">{r.plays.toLocaleString("es-AR")}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                  {t("pages.analyticsExplorer.noMetrics", "No hay métricas cargadas para estos filtros.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
