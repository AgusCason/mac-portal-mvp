import { requireRole } from "@/lib/auth";
import { getAgencyTools } from "@/lib/queries/tools";
import { getEditors } from "@/lib/queries/team";
import { ToolList, NewToolDialog } from "@/components/tools/tool-list";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Herramientas de la agencia (/admin/herramientas) — catálogo de apps con
 * sus accesos, compartibles con editores de forma individual o con todo el
 * equipo de una (ver `ShareToolDialog`).
 */
export default async function AdminHerramientasPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const [tools, editors] = await Promise.all([getAgencyTools(), getEditors()]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.herramientas.title", "Herramientas")}
        description={t(
          "pages.herramientas.description",
          "Apps y servicios que usa la agencia, con sus accesos — compartilos con los editores que los necesiten."
        )}
        actions={<NewToolDialog />}
      />

      <Card>
        <CardContent className="p-0">
          <ToolList tools={tools} editors={editors} />
        </CardContent>
      </Card>
    </div>
  );
}
