import { requireRole } from "@/lib/auth";
import { getCrmLeads } from "@/lib/queries/crm";
import { CrmBoard, NewLeadDialog } from "@/components/crm/crm-board";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { buildCsv, type CsvColumn } from "@/lib/export-csv";
import { Card } from "@/components/ui/card";
import { Wallet, Users, Trophy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CrmLead } from "@/types/database";
import { getT } from "@/lib/i18n/dictionary";

const OPEN_STAGES = ["nuevo", "contactado", "calificado", "propuesta"] as const;

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
  const crmCsv = buildCsv(CRM_CSV_COLUMNS, leads);

  const openLeads = leads.filter((l) => (OPEN_STAGES as readonly string[]).includes(l.stage));
  const openPipelineValue = openLeads.reduce((sum, l) => sum + (l.estimated_value ?? 0), 0);
  const wonCount = leads.filter((l) => l.stage === "ganado").length;
  const lostCount = leads.filter((l) => l.stage === "perdido").length;
  const closedCount = wonCount + lostCount;
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : null;

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
        <div className="flex items-center gap-2">
          <ExportCsvButton filename="crm.csv" csv={crmCsv} disabled={leads.length === 0} />
          <NewLeadDialog />
        </div>
      </div>

      {leads.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="glass-card flex-row items-center gap-3.5 p-4">
            <div className="icon-chip">
              <Wallet className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium uppercase">
                {t("pages.crm.openPipelineValue", "Pipeline abierto")}
              </p>
              <p className="text-xl font-semibold tabular-nums">{formatCurrency(openPipelineValue)}</p>
            </div>
          </Card>
          <Card className="glass-card flex-row items-center gap-3.5 p-4">
            <div className="icon-chip">
              <Users className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium uppercase">
                {t("pages.crm.openLeads", "Leads activos")}
              </p>
              <p className="text-xl font-semibold tabular-nums">{openLeads.length}</p>
            </div>
          </Card>
          <Card className="glass-card flex-row items-center gap-3.5 p-4">
            <div className="icon-chip">
              <Trophy className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium uppercase">
                {t("pages.crm.winRate", "Tasa de conversión")}
              </p>
              <p className="text-xl font-semibold tabular-nums">
                {winRate !== null ? `${winRate}%` : "—"}
              </p>
            </div>
          </Card>
        </div>
      )}

      <CrmBoard leads={leads} />
    </div>
  );
}
