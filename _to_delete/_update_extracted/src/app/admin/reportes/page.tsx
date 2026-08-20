import { requireRole } from "@/lib/auth";
import { getReports } from "@/lib/queries/reports";
import { getSelectableClients } from "@/lib/queries/content";
import { ReportList } from "@/components/reports/report-list";
import { NewReportDialog } from "@/components/reports/new-report-dialog";

export default async function AdminReportesPage() {
  await requireRole(["admin"]);
  const [reports, clients] = await Promise.all([getReports(), getSelectableClients()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reportes con IA</h1>
          <p className="text-muted-foreground text-sm">
            Resumen ejecutivo generado por Claude a partir de contenido publicado y
            métricas reales — revisalo y publicalo cuando esté listo para el cliente.
          </p>
        </div>
        <NewReportDialog clients={clients} />
      </div>
      <ReportList reports={reports} role="admin" />
    </div>
  );
}
