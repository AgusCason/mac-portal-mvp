import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getProjects } from "@/lib/queries/projects";
import { getSelectableClients } from "@/lib/queries/content";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { getProjectStatusLabel, PROJECT_STATUS_VARIANT } from "@/components/projects/project-status";
import { Badge } from "@/components/ui/badge";
import { ListChecks } from "lucide-react";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Management > Proyectos — equivalente a "Proyectos" de MB Suite: lista de
 * engagements/proyectos del workspace, cada uno con su propio tablero.
 */
export default async function AdminProyectosPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const [projects, clients] = await Promise.all([getProjects(), getSelectableClients()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("nav.management.proyectos", "Proyectos")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("pages.proyectos.pageDescription", "Engagements y proyectos del workspace.")}
          </p>
        </div>
        <NewProjectDialog clients={clients} />
      </div>

      {projects.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          {t("pages.proyectos.noProjects", "Todavía no creaste ningún proyecto.")}
        </p>
      )}

      <div className="space-y-2">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/admin/proyectos/${project.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{project.title}</p>
              <p className="text-muted-foreground truncate text-xs">
                {project.client_name
                  ? `${t("pages.proyectos.account", "Cuenta")}: ${project.client_name}`
                  : t("pages.proyectos.internal", "Proyecto interno")}
                {project.description && ` — ${project.description}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                <ListChecks className="size-3.5" /> {project.itemCount}
              </span>
              <Badge variant={PROJECT_STATUS_VARIANT[project.status]}>
                {getProjectStatusLabel(project.status, t)}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
