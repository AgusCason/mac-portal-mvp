import { requireRole } from "@/lib/auth";
import { getTasks } from "@/lib/queries/tasks";
import { getSelectableClients } from "@/lib/queries/content";
import { getAgencyStaff } from "@/lib/queries/team";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { TasksTable } from "@/components/tasks/tasks-table";
import { TaskFilters } from "@/components/tasks/task-filters";
import { DonutMini } from "@/components/shared/mini-charts";
import type { TaskStatus } from "@/types/database";
import { getT } from "@/lib/i18n/dictionary";

const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  pendiente: "var(--warning)",
  en_curso: "var(--info)",
  completada: "var(--success)",
  cancelada: "var(--destructive)",
};

const TASK_STATUS_LABEL_KEY: Record<TaskStatus, string> = {
  pendiente: "tasks.statusPendiente",
  en_curso: "tasks.statusEnCurso",
  completada: "tasks.statusCompletada",
  cancelada: "tasks.statusCancelada",
};

/**
 * Management > Tareas — equivalente a "Tareas del Workspace" de MB Suite.
 */
export default async function AdminTareasPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; estado?: string }>;
}) {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const { vista, estado } = await searchParams;

  const [clients, staff, tasks, allTasks] = await Promise.all([
    getSelectableClients(),
    getAgencyStaff(),
    getTasks({
      status: estado as TaskStatus | undefined,
      onlyPending: (vista ?? "pendientes") === "pendientes",
    }),
    // Sin filtro — para el donut de "Tareas por estado": el filtro/vista de
    // arriba es de la TABLA, no debe achicar el resumen (si no, con la vista
    // por defecto "pendientes" el donut nunca mostraría completadas).
    getTasks({}),
  ]);

  const pendingCount = tasks.filter((t) => t.status === "pendiente" || t.status === "en_curso").length;
  const STATUS_ORDER: TaskStatus[] = ["pendiente", "en_curso", "completada", "cancelada"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("tasks.adminPageTitle", "Tareas del Workspace")}
            <span className="text-muted-foreground ml-2 text-sm font-normal align-middle">
              · {pendingCount} pendiente{pendingCount === 1 ? "" : "s"}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("tasks.adminPageDescription", "Gestiona y asigna tareas para la agencia.")}
          </p>
        </div>
        <NewTaskDialog clients={clients} staff={staff} />
      </div>

      {allTasks.length > 0 && (
        <div className="glass-card flex flex-col items-center gap-5 rounded-2xl p-5 sm:flex-row sm:justify-around">
          <DonutMini
            segments={STATUS_ORDER.map((status) => ({
              label: t(TASK_STATUS_LABEL_KEY[status], status),
              value: allTasks.filter((task) => task.status === status).length,
              color: TASK_STATUS_COLOR[status],
            }))}
            size={100}
            strokeWidth={11}
            centerValue={allTasks.length}
            centerLabel={t("tasks.statusCenterLabel", "tareas")}
          />
          <div className="flex w-full flex-wrap justify-center gap-x-5 gap-y-2 sm:max-w-sm">
            {STATUS_ORDER.map((status) => {
              const count = allTasks.filter((task) => task.status === status).length;
              if (count === 0) return null;
              return (
                <div key={status} className="flex items-center gap-2 text-xs">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: TASK_STATUS_COLOR[status] }} />
                  <span className="text-muted-foreground">{t(TASK_STATUS_LABEL_KEY[status], status)}</span>
                  <strong className="tabular-nums">{count}</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TaskFilters />
      <TasksTable tasks={tasks} clients={clients} staff={staff.map((s) => ({ id: s.id, full_name: s.full_name }))} />
    </div>
  );
}
