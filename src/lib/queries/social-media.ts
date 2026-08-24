import "server-only";
import { getContentItems } from "@/lib/queries/content";
import { getSocialAccountsOverview } from "@/lib/queries/social";
import type { ContentItemWithClient } from "@/lib/queries/content";

export interface SocialMediaOverview {
  totalPieces: number;
  scheduledPieces: ContentItemWithClient[];
  byStatus: Record<string, number>;
  connectedAccounts: number;
  accountsByPlatform: Record<string, number>;
}

/** Social Media > Overview — resumen ejecutivo del módulo completo. */
export async function getSocialMediaOverview(): Promise<SocialMediaOverview> {
  const [items, accounts] = await Promise.all([getContentItems(), getSocialAccountsOverview()]);

  const byStatus: Record<string, number> = {};
  for (const item of items) byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;

  const accountsByPlatform: Record<string, number> = {};
  for (const acc of accounts) accountsByPlatform[acc.platform] = (accountsByPlatform[acc.platform] ?? 0) + 1;

  const scheduledPieces = items
    .filter((i) => i.status === "programado" && i.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
    .slice(0, 8);

  return {
    totalPieces: items.length,
    scheduledPieces,
    byStatus,
    connectedAccounts: accounts.length,
    accountsByPlatform,
  };
}
