import { requireRole } from "@/lib/auth";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { getReports } from "@/lib/queries/reports";
import { ReportList } from "@/components/reports/report-list";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

export default async function ClientReportesPage() {
  const profile = await requireRole(["client"]);
  const t = getT(profile.language);
  const clientId = await getPrimaryClientId(profile.id);
  const reports = clientId ? await getReports({ clientId }) : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.client.reportes", "Reportes")}
        description={t("pages.clientReportes.description", "Resúmenes de performance que la agencia habilitó para tu cuenta.")}
      />
      {clientId ? (
        <ReportList reports={reports} role="client" />
      ) : (
        <p className="text-muted-foreground text-sm">
          {t("pages.client.noClientLinked", "Tu cuenta todavía no está vinculada a ningún cliente.")}
        </p>
      )}
    </div>
  );
}
