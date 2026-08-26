import { requireRole } from "@/lib/auth";
import { getTasks } from "@/lib/queries/tasks";
import { getSelectableClients } from "@/lib/queries/content";
import { getAgencyStaff } from "@/lib/queries/team";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { TasksTable } from "@/components/tasks/tasks-table";
import { TaskFilters } from "@/components/tasks/task-filters";
import type { TaskStatus } from "@/types/database";
import { getT } from "@/lib/i18n/dictionary";

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

  const [clients, staff, tasks] = await Promise.all([
    getSelectableClients(),
    getAgencyStaff(),
    getTasks({
      status: estado as TaskStatus | undefined,
      onlyPending: (vista ?? "pendientes") === "pendientes",
    }),
  ]);

  const pendingCount = tasks.filter((t) => t.status === "pendiente" || t.status === "en_curso").length;

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

      <TaskFilters />
      <TasksTable tasks={tasks} clients={clients} staff={staff.map((s) => ({ id: s.id, full_name: s.full_name }))} />
    </div>
  );
}
