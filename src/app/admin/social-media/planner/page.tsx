import { requireAdmin } from "@/lib/auth";
import { getContentItems, getSelectableClients } from "@/lib/queries/content";
import { getMediaFolders, getMediaAssets } from "@/lib/queries/media-library";
import { PlannerView } from "@/components/social-media/planner-view";

/**
 * Social Media > Planner — kanban editorial + publicados + grilla IG +
 * media library, en pestañas (equivalente a `/demo-agency/social-media/planner`).
 */
export default async function AdminSocialMediaPlannerPage() {
  await requireAdmin();

  const [items, clients, folders, assets] = await Promise.all([
    getContentItems(),
    getSelectableClients(),
    getMediaFolders(),
    getMediaAssets(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Planner</h1>
        <p className="text-muted-foreground text-sm">Calendario editorial, publicados y grilla de Instagram.</p>
      </div>
      <PlannerView items={items} clients={clients} folders={folders} assets={assets} />
    </div>
  );
}
