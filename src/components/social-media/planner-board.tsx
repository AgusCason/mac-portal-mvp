"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, ImageOff, Loader2 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";

import type { ContentItemWithClient } from "@/lib/queries/content";
import type { ContentStatus } from "@/types/database";
import { getStatusLabel } from "@/components/dashboard/content-status-badge";
import { COLUMN_ORDER, NEXT_STATUS } from "@/components/content/content-board";
import { CATEGORY_META, getCategoryLabel } from "@/lib/content-category-meta";
import { NETWORK_META } from "@/lib/network-meta";
import { updateContentStatusAction } from "@/app/actions/content";
import { DeliverContentDialog } from "@/components/content/deliver-content-dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn, formatTime } from "@/lib/utils";

/** Fondo del stat-card grande y punto de color por columna — estilo MB Suite. */
export const STATUS_COLUMN_META: Record<ContentStatus, { header: string; dot: string }> = {
  borrador: {
    header: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  en_edicion: {
    header: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  por_aprobar: {
    header: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  requiere_cambios: {
    header: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    dot: "bg-red-500",
  },
  aprobado: {
    header: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
    dot: "bg-green-500",
  },
  programado: {
    header: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  publicado: {
    header: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
    dot: "bg-teal-500",
  },
};

function PlannerCard({ item }: { item: ContentItemWithClient }) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const network = NETWORK_META[item.network];
  const NetworkIcon = network.icon;
  const category = item.category ? getCategoryLabel(item.category, t) : null;
  const categoryDot = item.category ? CATEGORY_META[item.category].dot : null;
  const categoryPill = item.category ? CATEGORY_META[item.category].pill : null;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { status: item.status },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  function advance() {
    const next = NEXT_STATUS[item.status];
    if (!next) return;
    startTransition(async () => {
      const res = await updateContentStatusAction(item.id, next);
      if (res.ok) {
        toast.success(`${t("common.movedTo", "Movido a")} "${getStatusLabel(next, t)}"`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "border-border bg-card cursor-grab space-y-2.5 rounded-xl border p-3 shadow-sm transition-shadow active:cursor-grabbing",
        isDragging && "z-50 opacity-60 shadow-lg"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-lg">
          {item.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnail_url} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageOff className="text-muted-foreground size-4" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <NetworkIcon className="size-3" />
            {network.label}
            {item.scheduled_at && (
              <span className="ml-auto shrink-0 tabular-nums">{formatTime(item.scheduled_at)}</span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm font-medium">{item.title}</p>
        </div>
      </div>

      {category && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
            categoryPill
          )}
        >
          <span className={cn("size-1.5 rounded-full", categoryDot)} />
          {category}
        </span>
      )}

      <p className="text-muted-foreground truncate text-xs">{item.client_name}</p>

      {item.status === "en_edicion" && (
        <div onPointerDown={(e) => e.stopPropagation()}>
          <DeliverContentDialog contentId={item.id} clientId={item.client_id} title={item.title} />
        </div>
      )}
      {NEXT_STATUS[item.status] && item.status !== "en_edicion" && (
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={advance}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
          {getStatusLabel(NEXT_STATUS[item.status]!, t)}
        </Button>
      )}
    </div>
  );
}

function PlannerColumn({ status, items }: { status: ContentStatus; items: ContentItemWithClient[] }) {
  const { t } = useLocale();
  const colorMeta = STATUS_COLUMN_META[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const label = getStatusLabel(status, t);

  return (
    <div className="w-72 shrink-0 space-y-2">
      <div className={cn("rounded-xl px-4 py-3 text-center", colorMeta.header)}>
        <p className="text-2xl font-bold tabular-nums">{items.length}</p>
        <p className="text-xs font-medium">{label}</p>
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <span className={cn("size-2 rounded-full", colorMeta.dot)} />
          {label}
        </span>
        <span className="text-muted-foreground tabular-nums text-xs">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-16 space-y-2 rounded-lg transition-colors duration-150",
          isOver && "bg-accent/60 ring-1 ring-inset ring-border"
        )}
      >
        {items.length === 0 && (
          <p className="text-muted-foreground px-1 py-4 text-center text-xs">{t("components.content.noPieces", "Sin piezas")}</p>
        )}
        {items.map((item) => (
          <PlannerCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

/**
 * Vista "Tablero" del Planner — kanban propio de Social Media (distinto del
 * calendario editorial general en /admin/calendario): tarjetas con miniatura,
 * categoría y stat-cards de color por columna, estilo MB Suite.
 */
export function PlannerBoard({ items }: { items: ContentItemWithClient[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const grouped = React.useMemo(() => {
    const map = new Map<ContentStatus, ContentItemWithClient[]>();
    for (const status of COLUMN_ORDER) map.set(status, []);
    for (const item of items) map.get(item.status)?.push(item);
    return map;
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const targetStatus = over.id as ContentStatus;
    const currentStatus = active.data.current?.status as ContentStatus | undefined;
    if (!currentStatus || targetStatus === currentStatus) return;

    if (targetStatus === "por_aprobar") {
      toast.error(t("components.planner.approveViaDeliverError", 'Para pasar a "Por Aprobar" usá el botón de Entregar de la pieza (sube el archivo).'));
      return;
    }

    startTransition(async () => {
      const res = await updateContentStatusAction(active.id as string, targetStatus);
      if (res.ok) {
        toast.success(`${t("common.movedTo", "Movido a")} "${getStatusLabel(targetStatus, t)}"`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMN_ORDER.map((status) => (
          <PlannerColumn key={status} status={status} items={grouped.get(status) ?? []} />
        ))}
      </div>
    </DndContext>
  );
}
