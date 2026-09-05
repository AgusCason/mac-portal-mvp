import { requireAdmin } from "@/lib/auth";
import { getKbArticles } from "@/lib/queries/knowledge-base";
import { NewArticleDialog } from "@/components/knowledge-base/new-article-dialog";
import { KbArticlesView } from "@/components/knowledge-base/kb-articles-view";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Management > Knowledge Base — artículos internos del workspace, con
 * favoritos por usuario y contador de vistas.
 */
export default async function AdminKnowledgeBasePage() {
  const admin = await requireAdmin();
  const t = getT(admin.language);

  const articles = await getKbArticles(admin.id);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.knowledgeBase.title", "Knowledge Base")}
        description={t("pages.knowledgeBase.description", "Documentación interna y procesos de la agencia.")}
        actions={<NewArticleDialog />}
      />
      <KbArticlesView articles={articles} />
    </div>
  );
}
