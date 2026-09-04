import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getWebProjects } from "@/lib/queries/web-projects";
import { getSelectableClients } from "@/lib/queries/content";
import { NewWebProjectDialog } from "@/components/web-projects/new-web-project-dialog";
import {
  getWebProjectStageLabel,
  WEB_PROJECT_STAGE_VARIANT,
  WEB_PROJECT_STAGE_ALL,
} from "@/components/web-projects/web-project-stage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutMini } from "@/components/shared/mini-charts";
import { EmptyState } from "@/components/shared/empty-state";
import { Paperclip, PieChart, Globe } from "lucide-react";
import { getT } from "@/lib/i18n/dictionary";

/** Mismo color que ya usa cada Badge de etapa (ver web-project-stage.ts),
 *  traducido a token de CSS para el donut — nunca un color nuevo/inventado. */
const WEB_STAGE_COLOR: Record<string, string> = {
  secondary: "var(--muted-foreground)",
  info: "var(--info)",
  warning: "var(--warning)",
  success: "var(--success)",
  destructive: "var(--destructive)",
};

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

      {projects.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="icon-chip">
              <PieChart className="size-4" strokeWidth={1.75} />
            </div>
            <CardTitle>{t("pages.sitiosWeb.statusOverviewTitle", "Sitios por etapa")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around">
            <DonutMini
              segments={WEB_PROJECT_STAGE_ALL.map((stage) => ({
                label: getWebProjectStageLabel(stage, t),
                value: projects.filter((p) => p.stage === stage).length,
                color: WEB_STAGE_COLOR[WEB_PROJECT_STAGE_VARIANT[stage] as string],
              }))}
              centerValue={projects.length}
              centerLabel={t("pages.sitiosWeb.statusCenterLabel", "sitios")}
            />
            <div className="flex w-full flex-wrap justify-center gap-x-5 gap-y-2 sm:max-w-xs">
              {WEB_PROJECT_STAGE_ALL.map((stage) => {
                const count = projects.filter((p) => p.stage === stage).length;
                if (count === 0) return null;
                return (
                  <div key={stage} className="flex items-center gap-2 text-xs">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: WEB_STAGE_COLOR[WEB_PROJECT_STAGE_VARIANT[stage] as string] }}
                    />
                    <span className="text-muted-foreground">{getWebProjectStageLabel(stage, t)}</span>
                    <strong className="tabular-nums">{count}</strong>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {projects.length === 0 && (
        <EmptyState icon={Globe} title={t("components.webProjects.noProjects", "Todavía no creaste ningún proyecto web.")} />
      )}

      <div className="space-y-2">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/admin/sitios-web/${project.id}`}
            className="glass-card flex items-center justify-between gap-3 rounded-xl p-4 transition-colors hover:border-primary/40"
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
