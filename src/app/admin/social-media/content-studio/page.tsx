import { requireAdmin } from "@/lib/auth";
import { getContentIdeas } from "@/lib/queries/content-ideas";
import { getSelectableClients } from "@/lib/queries/content";
import { getMediaFolders, getMediaAssets } from "@/lib/queries/media-library";
import { ContentStudioView } from "@/components/content-studio/content-studio-view";
import { PageHeader } from "@/components/shared/page-header";

/**
 * Social Media > Content Studio — banco de ideas, guiones y captions,
 * equivalente a `/demo-agency/social-media/content-studio`.
 */
export default async function AdminContentStudioPage() {
  await requireAdmin();

  const [ideas, clients, folders, assets] = await Promise.all([
    getContentIdeas(),
    getSelectableClients(),
    getMediaFolders(),
    getMediaAssets(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Content Studio"
        description="Series, sesiones de fotos, guiones, captions y banco de contenido."
      />
      <ContentStudioView ideas={ideas} clients={clients} folders={folders} assets={assets} />
    </div>
  );
}
