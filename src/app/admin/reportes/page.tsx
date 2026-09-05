import { requireRole } from "@/lib/auth";
import { getReports } from "@/lib/queries/reports";
import { getSelectableClients } from "@/lib/queries/content";
import { ReportList } from "@/components/reports/report-list";
import { NewReportDialog } from "@/components/reports/new-report-dialog";
import { ReportFilters } from "@/components/reports/report-filters";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/shared/mini-charts";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";
import type { ReportStatus } from "@/types/database";

export default async function AdminReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; estado?: string; periodo?: string }>;
}) {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const { cliente, estado, periodo } = await searchParams;
  const clients = await getSelectableClients();
  const reports = await getReports({
    clientId: cliente,
    status: estado as ReportStatus | undefined,
    period: periodo,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.adminReportes.title", "Reportes con IA")}
        description={t(
          "pages.adminReportes.description",
          "Resumen ejecutivo generado por Claude a partir de contenido publicado y métricas reales — revisalo y publicalo cuando esté listo para el cliente."
        )}
        actions={<NewReportDialog clients={clients} />}
      />

      {reports.length > 0 && (() => {
        const publishedCount = reports.filter((r) => r.status === "published").length;
        return (
          <Card className="flex-row items-center gap-3.5 p-4">
            <ProgressRing value={publishedCount} max={reports.length} color="var(--success)" />
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">
                {t("pages.adminReportes.publishedRatioTitle", "Publicados sobre el total")}
              </p>
              <p className="text-muted-foreground text-xs">
                {publishedCount} {t("pages.adminReportes.ofTotal", "de")} {reports.length}
              </p>
            </div>
          </Card>
        );
      })()}

      <ReportFilters clients={clients} />
      <ReportList reports={reports} role="admin" />
    </div>
  );
}
