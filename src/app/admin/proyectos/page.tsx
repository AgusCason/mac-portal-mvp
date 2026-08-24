import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getProjects } from "@/lib/queries/projects";
import { getSelectableClients } from "@/lib/queries/content";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_VARIANT } from "@/components/projects/project-status";
import { Badge } from "@/components/ui/badge";
import { ListChecks } from "lucide-react";

/**
 * Management > Proyectos — equivalente a "Proyectos" de MB Suite: lista de
 * engagements/proyectos del workspace, cada uno con su propio tablero.
 */
export default async function AdminProyectosPage() {
  await requireRole(["admin"]);
  const [projects, clients] = await Promise.all([getProjects(), getSelectableClients()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground text-sm">Engagements y proyectos del workspace.</p>
        </div>
        <NewProjectDialog clients={clients} />
      </div>

      {projects.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Todavía no creaste ningún proyecto.
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
                {project.client_name ? `Cuenta: ${project.client_name}` : "Proyecto interno"}
                {project.description && ` — ${project.description}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                <ListChecks className="size-3.5" /> {project.itemCount}
              </span>
              <Badge variant={PROJECT_STATUS_VARIANT[project.status]}>
                {PROJECT_STATUS_LABEL[project.status]}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
