import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MediaAsset, MediaFolder } from "@/types/database";

export interface MediaFolderWithCount extends MediaFolder {
  asset_count: number;
}

export interface MediaAssetWithRelations extends MediaAsset {
  client_name: string | null;
}

/** Management > Media Library — carpetas con conteo de archivos. */
export async function getMediaFolders(limit = 300): Promise<MediaFolderWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media_folders")
    .select("*, media_assets(id)")
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[getMediaFolders]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const typed = row as unknown as MediaFolder & { media_assets: { id: string }[] };
    const { media_assets, ...rest } = typed;
    return { ...rest, asset_count: media_assets?.length ?? 0 };
  });
}

/** Archivos de una carpeta puntual, o todos si no se pasa folderId. */
export async function getMediaAssets(
  folderId?: string,
  limit = 300
): Promise<MediaAssetWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("media_assets")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (folderId) query = query.eq("folder_id", folderId);

  const { data, error } = await query;
  if (error) {
    console.error("[getMediaAssets]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const typed = row as unknown as MediaAsset & { clients: { name: string } | null };
    const { clients, ...rest } = typed;
    return { ...rest, client_name: clients?.name ?? null };
  });
}
