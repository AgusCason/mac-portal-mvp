import { requireRole } from "@/lib/auth";
import { getMediaFolders, getMediaAssets } from "@/lib/queries/media-library";
import { getSelectableClients } from "@/lib/queries/content";
import { MediaLibraryView } from "@/components/media-library/media-library-view";

/**
 * Management > Media Library — repositorio de archivos por carpeta/cuenta.
 */
export default async function AdminMediaLibraryPage() {
  await requireRole(["admin"]);

  const [folders, assets, clients] = await Promise.all([
    getMediaFolders(),
    getMediaAssets(),
    getSelectableClients(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Media Library</h1>
        <p className="text-muted-foreground text-sm">Archivos y assets compartidos del workspace.</p>
      </div>
      <MediaLibraryView folders={folders} assets={assets} clients={clients} />
    </div>
  );
}
