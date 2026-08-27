import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getWebProjects } from "@/lib/queries/web-projects";
import { getSelectableClients } from "@/lib/queries/content";
import { NewWebProjectDialog } from "@/components/web-projects/new-web-project-dialog";
import {
  getWebProjectStageLabel,
  WEB_PROJECT_STAGE_VARIANT,
} from "@/components/web-projects/web-project-stage";
import { Badge } from "@/components/ui/badge";
import { Paperclip } from "lucide-react";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Sitios Web — proyectos de diseño y desarrollo web por cliente, con sus
 * propias etapas (Brief → Mantenimiento). Análogo especializado de
 * "Proyectos" (genérico), ver `/admin/proyectos`.
 */
export default async function AdminSitiosWebPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const [projects, clients] = await Promise.all([getWebProjects(), getSelectableClients()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("nav.management.sitiosWeb", "Sitios Web")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("pages.sitiosWeb.description", "Proyectos de diseño y desarrollo web por cliente.")}
          </p>
        </div>
        <NewWebProjectDialog clients={clients} />
      </div>

      {projects.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          {t("components.webProjects.noProjects", "Todavía no creaste ningún proyecto web.")}
        </p>
      )}

      <div className="space-y-2">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/admin/sitios-web/${project.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{project.title}</p>
              <p className="text-muted-foreground truncate text-xs">
                {t("components.webProjects.account", "Cuenta")}: {project.client_name}
                {project.domain && ` — ${project.domain}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                <Paperclip className="size-3.5" /> {project.assetCount}
              </span>
              <Badge variant={WEB_PROJECT_STAGE_VARIANT[project.stage]}>
                {getWebProjectStageLabel(project.stage, t)}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
