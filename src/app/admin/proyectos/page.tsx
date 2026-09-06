import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getProjects } from "@/lib/queries/projects";
import { getSelectableClients } from "@/lib/queries/content";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import {
  getProjectStatusLabel,
  PROJECT_STATUS_VARIANT,
  PROJECT_STATUS_ORDER,
} from "@/components/projects/project-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutMini } from "@/components/shared/mini-charts";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ListChecks, PieChart, FolderKanban } from "lucide-react";
import { getT } from "@/lib/i18n/dictionary";

/** Mismo color que ya usa cada Badge de estado (ver project-status.ts),
 *  traducido a token de CSS para el donut — nunca un color nuevo/inventado. */
const PROJECT_STATUS_COLOR: Record<string, string> = {
  secondary: "var(--muted-foreground)",
  info: "var(--info)",
  warning: "var(--warning)",
  success: "var(--success)",
  destructive: "var(--destructive)",
};

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
      <PageHeader
        title={t("nav.proyectos.proyectos", "Proyectos")}
        description={t("pages.proyectos.pageDescription", "Engagements y proyectos del workspace.")}
        actions={<NewProjectDialog clients={clients} />}
      />

      {projects.length === 0 && (
        <EmptyState icon={FolderKanban} title={t("pages.proyectos.noProjects", "Todavía no creaste ningún proyecto.")} />
      )}

      {projects.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="icon-chip">
              <PieChart className="size-4" strokeWidth={1.75} />
            </div>
            <CardTitle>{t("pages.proyectos.statusOverviewTitle", "Proyectos por estado")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around">
            <DonutMini
              segments={PROJECT_STATUS_ORDER.map((status) => ({
                label: getProjectStatusLabel(status, t),
                value: projects.filter((p) => p.status === status).length,
                color: PROJECT_STATUS_COLOR[PROJECT_STATUS_VARIANT[status] as string],
              }))}
              centerValue={projects.length}
              centerLabel={t("pages.proyectos.statusCenterLabel", "proyectos")}
            />
            <div className="flex w-full flex-wrap justify-center gap-x-5 gap-y-2 sm:max-w-xs">
              {PROJECT_STATUS_ORDER.map((status) => {
                const count = projects.filter((p) => p.status === status).length;
                if (count === 0) return null;
                return (
                  <div key={status} className="flex items-center gap-2 text-xs">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: PROJECT_STATUS_COLOR[PROJECT_STATUS_VARIANT[status] as string] }}
                    />
                    <span className="text-muted-foreground">{getProjectStatusLabel(status, t)}</span>
                    <strong className="tabular-nums">{count}</strong>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/admin/proyectos/${project.id}`}
            className="glass-card flex items-center justify-between gap-3 rounded-xl p-4 transition-colors hover:border-primary/40"
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
