import { Camera, Music2, PlaySquare } from "lucide-react";
import type { ContentNetwork } from "@/types/database";

// Nota: lucide-react v1 eliminó los íconos de marca (Instagram/YouTube/TikTok)
// por temas de trademark. Usamos íconos genéricos equivalentes.
export const NETWORK_META: Record<
  ContentNetwork,
  { label: string; icon: typeof Camera }
> = {
  instagram_reel: { label: "Instagram Reel", icon: Camera },
  instagram_feed: { label: "Instagram Feed", icon: Camera },
  instagram_story: { label: "Instagram Story", icon: Camera },
  tiktok: { label: "TikTok", icon: Music2 },
  youtube_short: { label: "YouTube Short", icon: PlaySquare },
  youtube_long: { label: "YouTube", icon: PlaySquare },
};
