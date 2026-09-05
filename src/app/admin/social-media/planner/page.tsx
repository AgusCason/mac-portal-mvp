import { requireAdmin } from "@/lib/auth";
import { getContentItems, getSelectableClients } from "@/lib/queries/content";
import { getMediaFolders, getMediaAssets } from "@/lib/queries/media-library";
import { PlannerView } from "@/components/social-media/planner-view";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Social Media > Planner — kanban editorial + publicados + grilla IG +
 * media library, en pestañas (equivalente a `/demo-agency/social-media/planner`).
 */
export default async function AdminSocialMediaPlannerPage() {
  const profile = await requireAdmin();
  const t = getT(profile.language);

  const [items, clients, folders, assets] = await Promise.all([
    getContentItems(),
    getSelectableClients(),
    getMediaFolders(),
    getMediaAssets(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.socialMedia.planner", "Planner")}
        description={t("pages.socialPlanner.description", "Calendario editorial, publicados y grilla de Instagram.")}
      />
      <PlannerView items={items} clients={clients} folders={folders} assets={assets} />
    </div>
  );
}
