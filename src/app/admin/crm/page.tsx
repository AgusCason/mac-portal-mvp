import { requireRole } from "@/lib/auth";
import { getCrmLeads } from "@/lib/queries/crm";
import { CrmBoard } from "@/components/crm/crm-board";

export default async function CrmPage() {
  await requireRole(["admin"]);
  const leads = await getCrmLeads();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">CRM</h1>
        <p className="text-muted-foreground text-sm">
          Pipeline de prospectos comerciales — cuando ganás uno, dalo de alta como Cliente desde
          Clientes para que arranque a operar.
        </p>
      </div>
      <CrmBoard leads={leads} />
    </div>
  );
}
