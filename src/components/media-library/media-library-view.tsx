"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { FileText, Image as ImageIcon, Film, FileArchive, Folder, Trash2, Download, Loader2 } from "lucide-react";

import { deleteMediaAssetAction, deleteMediaFolderAction, getMediaAssetUrlAction } from "@/app/actions/media-library";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewFolderDialog } from "@/components/media-library/new-folder-dialog";
import { UploadAssetDialog } from "@/components/media-library/upload-asset-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useLocale } from "@/lib/i18n/locale-context";
import type { MediaAssetWithRelations, MediaFolderWithCount } from "@/lib/queries/media-library";

const COLOR_DOT: Record<string, string> = {
  gray: "bg-gray-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="text-muted-foreground size-8" />;
  if (mimeType.startsWith("video/")) return <Film className="text-muted-foreground size-8" />;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/"))
    return <FileText className="text-muted-foreground size-8" />;
  return <FileArchive className="text-muted-foreground size-8" />;
}

function AssetCard({ asset }: { asset: MediaAssetWithRelations }) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDownload() {
    startTransition(async () => {
      const res = await getMediaAssetUrlAction(asset.storage_path);
      if (res.ok) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteMediaAssetAction(asset.id, asset.storage_path);
      if (res.ok) {
        toast.success(t("components.mediaLibrary.fileDeleted", "Archivo eliminado"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="glass-card flex flex-col gap-2 rounded-xl p-3">
      <div className="bg-muted flex h-20 items-center justify-center rounded-lg">
        <AssetIcon mimeType={asset.mime_type} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{asset.file_name}</p>
        <p className="text-muted-foreground text-xs">
          {formatBytes(asset.size_bytes)}
          {asset.client_name ? ` · ${asset.client_name}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" disabled={isPending} onClick={handleDownload}>
          {isPending ? <Loader2 className="animate-spin" /> : <Download />} {t("components.mediaLibrary.view", "Ver")}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive hover:text-destructive size-7"
          disabled={isPending}
          onClick={handleDelete}
          aria-label={t("components.mediaLibrary.deleteFileAria", "Eliminar archivo")}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function MediaLibraryView({
  folders,
  assets,
  clients,
}: {
  folders: MediaFolderWithCount[];
  assets: MediaAssetWithRelations[];
  clients: { id: string; name: string }[];
}) {
  const { t } = useLocale();
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const filteredAssets = selectedFolder ? assets.filter((a) => a.folder_id === selectedFolder) : assets;

  function handleDeleteFolder(folderId: string) {
    startTransition(async () => {
      const res = await deleteMediaFolderAction(folderId);
      if (res.ok) {
        toast.success(t("components.mediaLibrary.folderDeleted", "Carpeta eliminada"));
        if (selectedFolder === folderId) setSelectedFolder(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <div className="space-y-2">
        <NewFolderDialog />
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => setSelectedFolder(null)}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm ${
              selectedFolder === null ? "bg-muted font-medium" : "hover:bg-muted/50 text-muted-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <Folder className="size-3.5" /> {t("components.mediaLibrary.allFolders", "Todos")}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {assets.length}
            </Badge>
          </button>
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm ${
                selectedFolder === folder.id ? "bg-muted font-medium" : "hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedFolder(folder.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className={`size-2 shrink-0 rounded-full ${COLOR_DOT[folder.color] ?? COLOR_DOT.gray}`} />
                <span className="truncate">{folder.name}</span>
              </button>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px]">
                  {folder.asset_count}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="text-muted-foreground hover:text-destructive hidden group-hover:block"
                  aria-label={t("components.mediaLibrary.deleteFolderAria", "Eliminar carpeta")}
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-end">
          <UploadAssetDialog folders={folders} clients={clients} currentFolderId={selectedFolder} />
        </div>
        {filteredAssets.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title={
              selectedFolder
                ? t("components.mediaLibrary.noFilesInFolder", "No hay archivos en esta carpeta.")
                : t("components.mediaLibrary.noFilesYet", "No hay archivos todavía.")
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
