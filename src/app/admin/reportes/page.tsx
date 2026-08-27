import { requireRole } from "@/lib/auth";
import { getReports } from "@/lib/queries/reports";
import { getSelectableClients } from "@/lib/queries/content";
import { ReportList } from "@/components/reports/report-list";
import { NewReportDialog } from "@/components/reports/new-report-dialog";
import { ReportFilters } from "@/components/reports/report-filters";
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
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("pages.adminReportes.title", "Reportes con IA")}</h1>
          <p className="text-muted-foreground text-sm">
            {t(
              "pages.adminReportes.description",
              "Resumen ejecutivo generado por Claude a partir de contenido publicado y métricas reales — revisalo y publicalo cuando esté listo para el cliente."
            )}
          </p>
        </div>
        <NewReportDialog clients={clients} />
      </div>
      <ReportFilters clients={clients} />
      <ReportList reports={reports} role="admin" />
    </div>
  );
}
