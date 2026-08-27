import { requireRole } from "@/lib/auth";
import { getCrmLeads } from "@/lib/queries/crm";
import { CrmBoard } from "@/components/crm/crm-board";
import { getT } from "@/lib/i18n/dictionary";

export default async function CrmPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const leads = await getCrmLeads();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("pages.crm.title", "CRM")}</h1>
        <p className="text-muted-foreground text-sm">
          {t(
            "pages.crm.description",
            "Pipeline de prospectos comerciales — cuando ganás uno, dalo de alta como Cliente desde Clientes para que arranque a operar."
          )}
        </p>
      </div>
      <CrmBoard leads={leads} />
    </div>
  );
}
