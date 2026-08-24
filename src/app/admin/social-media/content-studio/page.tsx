import { requireAdmin } from "@/lib/auth";
import { getContentIdeas } from "@/lib/queries/content-ideas";
import { getSelectableClients } from "@/lib/queries/content";
import { getMediaFolders, getMediaAssets } from "@/lib/queries/media-library";
import { ContentStudioView } from "@/components/content-studio/content-studio-view";

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
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Content Studio</h1>
        <p className="text-muted-foreground text-sm">Series, sesiones de fotos, guiones, captions y banco de contenido.</p>
      </div>
      <ContentStudioView ideas={ideas} clients={clients} folders={folders} assets={assets} />
    </div>
  );
}
