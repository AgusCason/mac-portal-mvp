import { requireRole } from "@/lib/auth";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { getWebProjects, getWebProjectDetail } from "@/lib/queries/web-projects";
import { WebProjectStageStepper } from "@/components/web-projects/web-project-stage-stepper";
import { WebProjectDetailsPanel } from "@/components/web-projects/web-project-details-panel";
import { WebProjectAssetsPanel } from "@/components/web-projects/web-project-assets-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Portal de Clientes > Mi sitio web — vista de solo avance de los proyectos
 * de Sitios Web propios: etapa actual, datos técnicos y entregables, con
 * aprobación/pedido de cambios (ver WebProjectAssetsPanel role="client").
 */
export default async function ClientSitioWebPage() {
  const profile = await requireRole(["client"]);
  const t = getT(profile.language);
  const clientId = await getPrimaryClientId(profile.id);
  const projects = clientId ? await getWebProjects(clientId) : [];
  const details = await Promise.all(projects.map((p) => getWebProjectDetail(p.id)));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("pages.clientSitioWeb.title", "Tu sitio web")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("pages.clientSitioWeb.description", "Seguí el avance de tu proyecto y aprobá los entregables.")}
        </p>
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Globe className="text-muted-foreground size-8" strokeWidth={1.5} />
            <p className="text-sm font-medium">
              {t("pages.clientSitioWeb.noProject", "Todavía no tenés un proyecto de sitio web en curso.")}
            </p>
          </CardContent>
        </Card>
      )}

      {details.map((detail) => {
        if (!detail) return null;
        const { project, assets } = detail;
        return (
          <div key={project.id} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{project.title}</h2>
              {project.description && <p className="text-muted-foreground text-sm">{project.description}</p>}
            </div>
            <WebProjectStageStepper stage={project.stage} />
            <WebProjectDetailsPanel project={project} />
            <WebProjectAssetsPanel projectId={project.id} assets={assets} role="client" />
          </div>
        );
      })}
    </div>
  );
}
