import { requireRole } from "@/lib/auth";
import { getContracts, type ContractWithClient } from "@/lib/queries/contracts";
import { getSelectableClients } from "@/lib/queries/content";
import { ContractList } from "@/components/contracts/contract-list";
import { NewContractDialog } from "@/components/contracts/new-contract-dialog";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { buildCsv, type CsvColumn } from "@/lib/export-csv";
import { formatDate } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";

const CONTRACT_STAGE_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  firmado: "Firmado",
};

const CONTRACT_CSV_COLUMNS: CsvColumn<ContractWithClient>[] = [
  { header: "Título", value: (c) => c.title },
  { header: "Cliente", value: (c) => c.client_name },
  { header: "Estado", value: (c) => CONTRACT_STAGE_LABEL[c.status] ?? c.status },
  { header: "Firmado el", value: (c) => (c.signed_at ? formatDate(c.signed_at) : "") },
  { header: "IP de firma", value: (c) => c.signed_ip },
  { header: "Creado", value: (c) => formatDate(c.created_at) },
];

export default async function AdminContratosPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const [contracts, clients] = await Promise.all([getContracts(), getSelectableClients()]);
  const contractsCsv = buildCsv(CONTRACT_CSV_COLUMNS, contracts);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("nav.contratos", "Contratos")}</h1>
          <p className="text-muted-foreground text-sm">
            Acuerdos de servicio y confidencialidad, con trazabilidad de firma.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton filename="contratos.csv" csv={contractsCsv} disabled={contracts.length === 0} />
          <NewContractDialog clients={clients} />
        </div>
      </div>
      <ContractList contracts={contracts} role="admin" />
    </div>
  );
}
