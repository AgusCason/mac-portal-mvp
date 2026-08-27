"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createTaskAction } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskFormFields } from "@/components/tasks/task-form-fields";
import { useLocale } from "@/lib/i18n/locale-context";

export function NewTaskDialog({
  clients,
  staff,
}: {
  clients: { id: string; name: string }[];
  staff: { id: string; full_name: string }[];
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createTaskAction(formData);
      if (res.ok) {
        toast.success(t("components.tasks.taskCreated", "Tarea creada"));
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
        <Button size="sm">
          <Plus /> {t("components.tasks.newTask", "Nueva Tarea")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.tasks.newTaskTitle", "Nueva tarea")}</DialogTitle>
            <DialogDescription>{t("components.tasks.newTaskDesc", "Gestiona y asigná tareas para el workspace.")}</DialogDescription>
          </DialogHeader>
          <TaskFormFields clients={clients} staff={staff} />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("components.tasks.create", "Crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
