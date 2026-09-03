"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, GripVertical, Trash2, Loader2 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";

import type { ProjectItemWithAssignee } from "@/lib/queries/projects";
import {
  createProjectItemAction,
  updateProjectItemStatusAction,
  deleteProjectItemAction,
} from "@/app/actions/projects";
import {
  getProjectStatusLabel,
  PROJECT_STATUS_VARIANT,
  PROJECT_STATUS_ORDER,
} from "@/components/projects/project-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import type { ProjectStatus } from "@/types/database";

function AddItemDialog({ projectId, status }: { projectId: string; status: ProjectStatus }) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createProjectItemAction(projectId, formData);
      if (res.ok) {
        toast.success(t("components.projects.cardAdded", "Card agregada"));
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
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 px-1 text-xs"
        >
          <Plus className="size-3.5" /> {t("components.projects.addCard", "Agregar card")}
        </button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {t("components.projects.newCardTitlePrefix", "Nueva card —")} {getProjectStatusLabel(status, t)}
            </DialogTitle>
          </DialogHeader>
          <Input name="title" required placeholder={t("components.projects.cardTitlePlaceholder", "Título de la card")} autoFocus />
          <Input name="dueDate" type="date" />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("common.add", "Agregar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ItemCard({ item, projectId }: { item: ProjectItemWithAssignee; projectId: string }) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { status: item.status },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteProjectItemAction(item.id, projectId);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card ref={setNodeRef} style={style} className={cn("glass-card gap-2 py-3", isDragging && "z-50 opacity-60 shadow-lg")}>
      <CardHeader className="px-3">
        <CardTitle className="flex items-start justify-between gap-2 text-sm font-medium">
          <span className="line-clamp-2">{item.title}</span>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="text-muted-foreground hover:text-destructive"
              aria-label={t("components.projects.deleteCardAriaLabel", "Eliminar card")}
            >
              <Trash2 className="size-3.5" />
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
              aria-label={t("components.projects.dragToChangeColumnAriaLabel", "Arrastrar para cambiar de columna")}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 px-3">
        {item.assignee_name && <p className="text-muted-foreground text-xs">{item.assignee_name}</p>}
        {item.due_date && <p className="text-muted-foreground text-xs">{formatDate(item.due_date)}</p>}
      </CardContent>
    </Card>
  );
}

function BoardColumn({
  status,
  items,
  projectId,
}: {
  status: ProjectStatus;
  items: ProjectItemWithAssignee[];
  projectId: string;
}) {
  const { t } = useLocale();
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="min-w-0 lg:w-64 lg:shrink-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <Badge variant={PROJECT_STATUS_VARIANT[status]}>{getProjectStatusLabel(status, t)}</Badge>
        <span className="text-muted-foreground tabular-nums text-xs">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-16 space-y-2 rounded-lg transition-colors duration-150",
          isOver && "bg-accent/60 ring-1 ring-inset ring-border"
        )}
      >
        {items.map((item) => (
          <ItemCard key={item.id} item={item} projectId={projectId} />
        ))}
      </div>
      <div className="mt-2 px-1">
        <AddItemDialog projectId={projectId} status={status} />
      </div>
    </div>
  );
}

/** Tablero kanban de un proyecto — equivalente a la vista "Tablero" de MB Suite. */
export function ProjectBoard({
  projectId,
  items,
}: {
  projectId: string;
  items: ProjectItemWithAssignee[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const grouped = React.useMemo(() => {
    const map = new Map<ProjectStatus, ProjectItemWithAssignee[]>();
    for (const status of PROJECT_STATUS_ORDER) map.set(status, []);
    for (const item of items) map.get(item.status)?.push(item);
    return map;
  }, [items]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const targetStatus = over.id as ProjectStatus;
    const currentStatus = active.data.current?.status as ProjectStatus | undefined;
    if (!currentStatus || targetStatus === currentStatus) return;

    startTransition(async () => {
      const res = await updateProjectItemStatusAction(active.id as string, projectId, targetStatus);
      if (res.ok) {
        toast.success(`${t("common.movedTo", "Movido a")} "${getProjectStatusLabel(targetStatus, t)}"`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:overflow-x-auto lg:pb-2">
        {PROJECT_STATUS_ORDER.map((status) => (
          <BoardColumn key={status} status={status} items={grouped.get(status) ?? []} projectId={projectId} />
        ))}
      </div>
    </DndContext>
  );
}
