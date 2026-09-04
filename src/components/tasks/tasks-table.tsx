"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2, ListChecks } from "lucide-react";

import {
  updateTaskStatusAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/app/actions/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskFormFields } from "@/components/tasks/task-form-fields";
import { EmptyState } from "@/components/shared/empty-state";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn, formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/queries/tasks";

const PRIORITY_VARIANT: Record<string, React.ComponentProps<typeof Badge>["variant"]> = {
  baja: "secondary",
  media: "info",
  alta: "warning",
  urgente: "destructive",
};

const PRIORITY_LABEL_KEY: Record<string, { key: string; fallback: string }> = {
  baja: { key: "components.tasks.priorityBaja", fallback: "Baja" },
  media: { key: "components.tasks.priorityMedia", fallback: "Media" },
  alta: { key: "components.tasks.priorityAlta", fallback: "Alta" },
  urgente: { key: "components.tasks.priorityUrgente", fallback: "Urgente" },
};

function EditTaskDialog({
  task,
  clients,
  staff,
}: {
  task: TaskWithRelations;
  clients: { id: string; name: string }[];
  staff: { id: string; full_name: string }[];
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateTaskAction(task.id, formData);
      if (res.ok) {
        toast.success(t("components.tasks.taskUpdated", "Tarea actualizada"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTaskAction(task.id);
      if (res.ok) {
        toast.success(t("components.tasks.taskDeleted", "Tarea eliminada"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="text-muted-foreground hover:text-foreground" aria-label={t("components.tasks.editTaskAria", "Editar tarea")}>
          <Pencil className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.tasks.editTaskTitle", "Editar tarea")}</DialogTitle>
          </DialogHeader>
          <TaskFormFields task={task} clients={clients} staff={staff} />
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              <Trash2 /> {t("common.delete", "Eliminar")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("common.save", "Guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Tabla de Tareas — checkbox rápido para marcar completada/pendiente
 * (equivalente a la columna STATUS de MB Suite), prioridad, cuenta,
 * responsable y vencimiento (en rojo si ya venció y sigue abierta).
 */
export function TasksTable({
  tasks,
  clients,
  staff,
}: {
  tasks: TaskWithRelations[];
  clients: { id: string; name: string }[];
  staff: { id: string; full_name: string }[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function toggleComplete(task: TaskWithRelations) {
    const nextStatus = task.status === "completada" ? "pendiente" : "completada";
    startTransition(async () => {
      const res = await updateTaskStatusAction(task.id, nextStatus);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title={t("components.tasks.noTasksForFilters", "No hay tareas para estos filtros.")}
        hint={t("components.tasks.noTasksForFiltersHint", "Probá otro filtro o creá una tarea con \"Nueva Tarea\" arriba.")}
      />
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>{t("components.tasks.tableTask", "Tarea")}</TableHead>
            <TableHead>{t("components.tasks.tableAccount", "Cuenta")}</TableHead>
            <TableHead>{t("components.tasks.tablePriority", "Prioridad")}</TableHead>
            <TableHead>{t("components.tasks.tableAssignee", "Responsable")}</TableHead>
            <TableHead>{t("components.tasks.tableDueDate", "Vencimiento")}</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const isDone = task.status === "completada" || task.status === "cancelada";
            const isOverdue = !isDone && task.due_date != null && task.due_date < today;
            const priorityMeta = PRIORITY_LABEL_KEY[task.priority];
            return (
              <TableRow key={task.id}>
                <TableCell>
                  <Checkbox checked={isDone} onCheckedChange={() => toggleComplete(task)} />
                </TableCell>
                <TableCell>
                  <p className={cn("text-sm font-medium", isDone && "text-muted-foreground line-through")}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-muted-foreground truncate text-xs">{task.description}</p>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {task.client_name ?? t("components.tasks.privateAccount", "Privada")}
                </TableCell>
                <TableCell>
                  <Badge variant={PRIORITY_VARIANT[task.priority]}>{t(priorityMeta.key, priorityMeta.fallback)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {task.assignee_name ?? t("components.tasks.unassigned", "Sin asignar")}
                </TableCell>
                <TableCell className={cn("tabular-nums text-sm", isOverdue && "text-destructive font-medium")}>
                  {task.due_date ? formatDate(task.due_date) : "—"}
                </TableCell>
                <TableCell>
                  <EditTaskDialog task={task} clients={clients} staff={staff} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
