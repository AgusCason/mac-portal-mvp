import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getWebProjectDetail } from "@/lib/queries/web-projects";
import { WebProjectStageStepper, WebProjectStageSelect } from "@/components/web-projects/web-project-stage-stepper";
import { WebProjectDetailsPanel } from "@/components/web-projects/web-project-details-panel";
import { WebProjectAssetsPanel } from "@/components/web-projects/web-project-assets-panel";
import { getT } from "@/lib/i18n/dictionary";

/** Ficha de un proyecto de Sitios Web — etapa, datos técnicos y entregables. */
export default async function AdminSitioWebDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const { id } = await params;
  const detail = await getWebProjectDetail(id);
  if (!detail) notFound();

  const { project, assets } = detail;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{project.title}</h1>
          <p className="text-muted-foreground text-sm">
            {t("components.webProjects.account", "Cuenta")}: {project.client_name}
            {project.description && ` — ${project.description}`}
          </p>
        </div>
        <WebProjectStageSelect projectId={project.id} stage={project.stage} />
      </div>

      <WebProjectStageStepper stage={project.stage} />

      <WebProjectDetailsPanel project={project} editable />

      <WebProjectAssetsPanel projectId={project.id} assets={assets} role="admin" />
    </div>
  );
}
