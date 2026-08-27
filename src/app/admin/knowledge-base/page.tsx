import { requireAdmin } from "@/lib/auth";
import { getKbArticles } from "@/lib/queries/knowledge-base";
import { NewArticleDialog } from "@/components/knowledge-base/new-article-dialog";
import { KbArticlesView } from "@/components/knowledge-base/kb-articles-view";
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
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("pages.knowledgeBase.title", "Knowledge Base")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("pages.knowledgeBase.description", "Documentación interna y procesos de la agencia.")}
          </p>
        </div>
        <NewArticleDialog />
      </div>
      <KbArticlesView articles={articles} />
    </div>
  );
}
