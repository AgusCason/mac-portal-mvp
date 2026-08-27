import { requireRole } from "@/lib/auth";
import { getContracts } from "@/lib/queries/contracts";
import { getSelectableClients } from "@/lib/queries/content";
import { ContractList } from "@/components/contracts/contract-list";
import { NewContractDialog } from "@/components/contracts/new-contract-dialog";
import { getT } from "@/lib/i18n/dictionary";

export default async function AdminContratosPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const [contracts, clients] = await Promise.all([getContracts(), getSelectableClients()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("nav.contratos", "Contratos")}</h1>
          <p className="text-muted-foreground text-sm">
            Acuerdos de servicio y confidencialidad, con trazabilidad de firma.
          </p>
        </div>
        <NewContractDialog clients={clients} />
      </div>
      <ContractList contracts={contracts} role="admin" />
    </div>
  );
}
