import { requireRole } from "@/lib/auth";
import { getUtmLinks } from "@/lib/queries/analytics";
import { getSelectableClients } from "@/lib/queries/content";
import { UtmBuilderForm } from "@/components/analytics/utm-builder-form";
import { UtmHistory } from "@/components/analytics/utm-history";
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
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("pages.utmBuilder.title", "UTM Builder")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("pages.utmBuilder.description", "Armá URLs de campaña con parámetros UTM y reutilizá el historial.")}
        </p>
      </div>

      <UtmBuilderForm clients={clients} />

      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">{t("pages.utmBuilder.historyLabel", "Historial")}</p>
        <UtmHistory links={links} />
      </div>
    </div>
  );
}
