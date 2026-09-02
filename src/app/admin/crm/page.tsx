import { requireRole } from "@/lib/auth";
import { getCrmLeads } from "@/lib/queries/crm";
import { CrmBoard } from "@/components/crm/crm-board";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import type { CsvColumn } from "@/lib/export-csv";
import type { CrmLead } from "@/types/database";
import { getT } from "@/lib/i18n/dictionary";

const CRM_STAGE_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  calificado: "Calificado",
  propuesta: "Propuesta",
  ganado: "Ganado",
  perdido: "Perdido",
};

const CRM_CSV_COLUMNS: CsvColumn<CrmLead>[] = [
  { header: "Nombre", value: (l) => l.name },
  { header: "Contacto", value: (l) => l.contact_name },
  { header: "Email", value: (l) => l.contact_email },
  { header: "Teléfono", value: (l) => l.contact_phone },
  { header: "Origen", value: (l) => l.source },
  { header: "Valor estimado", value: (l) => l.estimated_value },
  { header: "Etapa", value: (l) => CRM_STAGE_LABEL[l.stage] ?? l.stage },
];

export default async function CrmPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const leads = await getCrmLeads();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("pages.crm.title", "CRM")}</h1>
          <p className="text-muted-foreground text-sm">
            {t(
              "pages.crm.description",
              "Pipeline de prospectos comerciales — cuando ganás uno, dalo de alta como Cliente desde Clientes para que arranque a operar."
            )}
          </p>
        </div>
        <ExportCsvButton filename="crm.csv" columns={CRM_CSV_COLUMNS} rows={leads} />
      </div>
      <CrmBoard leads={leads} />
    </div>
  );
}
