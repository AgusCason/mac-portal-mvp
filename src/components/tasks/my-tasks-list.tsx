"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateMyTaskStatusAction } from "@/app/actions/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import type { TaskWithRelations } from "@/lib/queries/tasks";

const PRIORITY_VARIANT: Record<string, React.ComponentProps<typeof Badge>["variant"]> = {
  baja: "secondary",
  media: "info",
  alta: "warning",
  urgente: "destructive",
};

const PRIORITY_LABEL: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

/**
 * "Mis tareas" del editor — a diferencia de `TasksTable` (admin), es
 * read-mostly: el editor no puede reasignar, editar título/prioridad ni
 * borrar, solo marcar completada/pendiente su propia tarea
 * (`updateMyTaskStatusAction`, gateado además por RLS —
 * "tasks_editor_update_own" en 0023_editor_tasks_rls.sql).
 */
export function MyTasksList({ tasks }: { tasks: TaskWithRelations[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { t } = useLocale();

  function toggleComplete(task: TaskWithRelations) {
    const nextStatus = task.status === "completada" ? "pendiente" : "completada";
    startTransition(async () => {
      const res = await updateMyTaskStatusAction(task.id, nextStatus);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {t("tasks.noTasks", "No tenés tareas asignadas por ahora.")}
      </p>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => {
        const isDone = task.status === "completada" || task.status === "cancelada";
        const isOverdue = !isDone && task.due_date != null && task.due_date < today;
        return (
          <Card key={task.id}>
            <CardContent className="flex items-start gap-3 py-3">
              <Checkbox
                className="mt-0.5"
                checked={isDone}
                onCheckedChange={() => toggleComplete(task)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn("text-sm font-medium", isDone && "text-muted-foreground line-through")}>
                    {task.title}
                  </p>
                  <Badge variant={PRIORITY_VARIANT[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
                </div>
                {task.description && (
                  <p className="text-muted-foreground mt-0.5 text-xs">{task.description}</p>
                )}
                <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 text-xs">
                  <span>{task.client_name ?? "Privada"}</span>
                  {task.due_date && (
                    <span className={cn(isOverdue && "text-destructive font-medium")}>
                      {formatDate(task.due_date)}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
