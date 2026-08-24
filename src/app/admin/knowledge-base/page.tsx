import { requireAdmin } from "@/lib/auth";
import { getKbArticles } from "@/lib/queries/knowledge-base";
import { NewArticleDialog } from "@/components/knowledge-base/new-article-dialog";
import { KbArticlesView } from "@/components/knowledge-base/kb-articles-view";

/**
 * Management > Knowledge Base — artículos internos del workspace, con
 * favoritos por usuario y contador de vistas.
 */
export default async function AdminKnowledgeBasePage() {
  const admin = await requireAdmin();

  const articles = await getKbArticles(admin.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground text-sm">Documentación interna y procesos de la agencia.</p>
        </div>
        <NewArticleDialog />
      </div>
      <KbArticlesView articles={articles} />
    </div>
  );
}
