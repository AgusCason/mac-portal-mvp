import { requireRole } from "@/lib/auth";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { getReports } from "@/lib/queries/reports";
import { ReportList } from "@/components/reports/report-list";
import { getT } from "@/lib/i18n/dictionary";

export default async function ClientReportesPage() {
  const profile = await requireRole(["client"]);
  const t = getT(profile.language);
  const clientId = await getPrimaryClientId(profile.id);
  const reports = clientId ? await getReports({ clientId }) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("nav.client.reportes", "Reportes")}</h1>
        <p className="text-muted-foreground text-sm">
          Resúmenes de performance que la agencia habilitó para tu cuenta.
        </p>
      </div>
      {clientId ? (
        <ReportList reports={reports} role="client" />
      ) : (
        <p className="text-muted-foreground text-sm">
          Tu cuenta todavía no está vinculada a ningún cliente.
        </p>
      )}
    </div>
  );
}
