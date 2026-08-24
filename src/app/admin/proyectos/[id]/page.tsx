import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getProjectDetail } from "@/lib/queries/projects";
import { ProjectBoard } from "@/components/projects/project-board";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_VARIANT } from "@/components/projects/project-status";
import { Badge } from "@/components/ui/badge";

/**
 * Ficha de un Proyecto — tablero kanban de sus items (Fase Management,
 * equivalente a la vista de detalle de un proyecto en MB Suite).
 */
export default async function AdminProyectoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;
  const detail = await getProjectDetail(id);
  if (!detail) notFound();

  const { project, items } = detail;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{project.title}</h1>
          <p className="text-muted-foreground text-sm">
            {project.client_name ? `Cuenta: ${project.client_name}` : "Proyecto interno"}
            {project.description && ` — ${project.description}`}
          </p>
        </div>
        <Badge variant={PROJECT_STATUS_VARIANT[project.status]}>
          {PROJECT_STATUS_LABEL[project.status]}
        </Badge>
      </div>

      <ProjectBoard projectId={project.id} items={items} />
    </div>
  );
}
