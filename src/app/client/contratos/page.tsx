import { requireRole } from "@/lib/auth";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { getContracts } from "@/lib/queries/contracts";
import { ContractList } from "@/components/contracts/contract-list";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

export default async function ClientContratosPage() {
  const profile = await requireRole(["client"]);
  const t = getT(profile.language);
  const clientId = await getPrimaryClientId(profile.id);
  const contracts = clientId ? await getContracts(clientId) : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.clientContratos.title", "Tus contratos")}
        description={t("pages.clientContratos.description", "Revisá y firmá tus acuerdos de servicio.")}
      />
      <ContractList contracts={contracts} role="client" />
    </div>
  );
}
