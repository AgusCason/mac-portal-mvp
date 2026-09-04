import { requireRole } from "@/lib/auth";
import { getMediaFolders, getMediaAssets } from "@/lib/queries/media-library";
import { getSelectableClients } from "@/lib/queries/content";
import { MediaLibraryView } from "@/components/media-library/media-library-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutMini } from "@/components/shared/mini-charts";
import { HardDrive } from "lucide-react";
import { getT } from "@/lib/i18n/dictionary";

/** Misma categorización de mime-type que usa cada `AssetIcon` en
 *  media-library-view.tsx — no inventa tipos nuevos, solo los agrupa. */
function assetCategory(mimeType: string): "image" | "video" | "document" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) return "document";
  return "other";
}

const CATEGORY_COLOR = {
  image: "var(--info)",
  video: "var(--warning)",
  document: "var(--success)",
  other: "var(--muted-foreground)",
} as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Management > Media Library — repositorio de archivos por carpeta/cuenta.
 */
export default async function AdminMediaLibraryPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);

  const [folders, assets, clients] = await Promise.all([
    getMediaFolders(),
    getMediaAssets(),
    getSelectableClients(),
  ]);

  const CATEGORY_ORDER = ["image", "video", "document", "other"] as const;
  const CATEGORY_LABEL: Record<(typeof CATEGORY_ORDER)[number], string> = {
    image: t("pages.mediaLibrary.categoryImage", "Imágenes"),
    video: t("pages.mediaLibrary.categoryVideo", "Videos"),
    document: t("pages.mediaLibrary.categoryDocument", "Documentos"),
    other: t("pages.mediaLibrary.categoryOther", "Otros"),
  };
  const totalBytes = assets.reduce((sum, a) => sum + a.size_bytes, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Media Library</h1>
        <p className="text-muted-foreground text-sm">Archivos y assets compartidos del workspace.</p>
      </div>

      {assets.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="icon-chip">
              <HardDrive className="size-4" strokeWidth={1.75} />
            </div>
            <CardTitle>{t("pages.mediaLibrary.byTypeTitle", "Archivos por tipo")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around">
            <DonutMini
              segments={CATEGORY_ORDER.map((cat) => ({
                label: CATEGORY_LABEL[cat],
                value: assets.filter((a) => assetCategory(a.mime_type) === cat).length,
                color: CATEGORY_COLOR[cat],
              }))}
              centerValue={assets.length}
              centerLabel={t("pages.mediaLibrary.centerLabel", "archivos")}
            />
            <div className="flex w-full flex-col gap-2 sm:max-w-xs">
              {CATEGORY_ORDER.map((cat) => {
                const count = assets.filter((a) => assetCategory(a.mime_type) === cat).length;
                if (count === 0) return null;
                return (
                  <div key={cat} className="flex items-center gap-2 text-xs">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: CATEGORY_COLOR[cat] }} />
                    <span className="text-muted-foreground">{CATEGORY_LABEL[cat]}</span>
                    <strong className="ml-auto tabular-nums">{count}</strong>
                  </div>
                );
              })}
              <div className="border-border/60 mt-1 flex items-center justify-between border-t pt-2 text-xs">
                <span className="text-muted-foreground">{t("pages.mediaLibrary.totalSize", "Espacio usado")}</span>
                <strong className="tabular-nums">{formatBytes(totalBytes)}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <MediaLibraryView folders={folders} assets={assets} clients={clients} />
    </div>
  );
}
