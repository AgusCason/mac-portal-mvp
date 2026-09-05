import { requireRole } from "@/lib/auth";
import { getUtmLinks } from "@/lib/queries/analytics";
import { getSelectableClients } from "@/lib/queries/content";
import { UtmBuilderForm } from "@/components/analytics/utm-builder-form";
import { UtmHistory } from "@/components/analytics/utm-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Analytics > UTM Builder — equivalente a `/demo-agency/analytics/utm-builder`
 * de MB Suite: arma URLs de campaña con parámetros UTM y guarda el historial.
 */
export default async function AnalyticsUtmBuilderPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const [clients, links] = await Promise.all([getSelectableClients(), getUtmLinks()]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.utmBuilder.title", "UTM Builder")}
        description={t("pages.utmBuilder.description", "Armá URLs de campaña con parámetros UTM y reutilizá el historial.")}
      />

      <UtmBuilderForm clients={clients} />

      <Card className="glass-card">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="icon-chip">
            <History className="size-4" strokeWidth={1.75} />
          </div>
          <CardTitle>{t("pages.utmBuilder.historyLabel", "Historial")}</CardTitle>
        </CardHeader>
        <CardContent>
          <UtmHistory links={links} />
        </CardContent>
      </Card>
    </div>
  );
}
