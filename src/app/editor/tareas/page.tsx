import { requireRole } from "@/lib/auth";
import { getMyTasks } from "@/lib/queries/tasks";
import { MyTasksList } from "@/components/tasks/my-tasks-list";
import { TaskFilters } from "@/components/tasks/task-filters";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";
import type { TaskStatus } from "@/types/database";

/** "Mis tareas" — vista del editor sobre lo que el admin le asignó en /admin/tareas. */
export default async function EditorTareasPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; estado?: string }>;
}) {
  const profile = await requireRole(["editor"]);
  const t = getT(profile.language);
  const { vista, estado } = await searchParams;

  const tasks = await getMyTasks(profile.id, {
    status: estado as TaskStatus | undefined,
    onlyPending: (vista ?? "pendientes") === "pendientes",
  });

  const pendingCount = tasks.filter((task) => task.status === "pendiente" || task.status === "en_curso").length;

  return (
    <div className="space-y-4">
      <PageHeader
        title={
          <>
            {t("tasks.editorPageTitle", "Mis tareas")}
            <span className="text-muted-foreground ml-2 text-sm font-normal align-middle">
              · {pendingCount} pendiente{pendingCount === 1 ? "" : "s"}
            </span>
          </>
        }
        description={t("tasks.editorPageDescription", "Tareas que te asignó el admin.")}
      />

      <TaskFilters />
      <MyTasksList tasks={tasks} />
    </div>
  );
}
