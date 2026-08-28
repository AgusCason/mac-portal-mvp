import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getWebProjectDetail } from "@/lib/queries/web-projects";
import { getInvoicesForWebProject } from "@/lib/queries/billing";
import { WebProjectStageStepper, WebProjectStageSelect } from "@/components/web-projects/web-project-stage-stepper";
import { WebProjectDetailsPanel } from "@/components/web-projects/web-project-details-panel";
import { WebProjectAssetsPanel } from "@/components/web-projects/web-project-assets-panel";
import { WebProjectInvoicesPanel } from "@/components/web-projects/web-project-invoices-panel";
import { getT } from "@/lib/i18n/dictionary";
import type { Plan } from "@/types/database";

/** Ficha de un proyecto de Sitios Web — etapa, datos técnicos, entregables y facturación. */
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
  const supabase = await createSupabaseServerClient();
  const [invoices, { data: plans }] = await Promise.all([
    getInvoicesForWebProject(project.id),
    supabase.from("plans").select("*").order("price_monthly"),
  ]);
  const planOptions = (plans as Plan[] ?? []).map((p) => ({ id: p.id, name: p.name }));

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

      <WebProjectInvoicesPanel
        invoices={invoices}
        role="admin"
        webProjectId={project.id}
        client={{ id: project.client_id, name: project.client_name }}
        plans={planOptions}
      />
    </div>
  );
}
