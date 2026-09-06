import { requireRole } from "@/lib/auth";
import { getToolsSharedWithEditor } from "@/lib/queries/tools";
import { MyToolsGrid } from "@/components/tools/my-tool-card";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

/** Herramientas compartidas con este editor (/editor/herramientas). */
export default async function EditorHerramientasPage() {
  const profile = await requireRole(["editor"]);
  const t = getT(profile.language);
  const tools = await getToolsSharedWithEditor(profile.id);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.editorHerramientas.title", "Herramientas")}
        description={t(
          "pages.editorHerramientas.description",
          "Apps y accesos que te compartió la agencia — solo lo que necesitás para usarlas."
        )}
      />
      <MyToolsGrid tools={tools} />
    </div>
  );
}
