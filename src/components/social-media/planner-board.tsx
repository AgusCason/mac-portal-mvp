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
import { STATUS_META, getStatusLabel } from "@/components/dashboard/content-status-badge";
import { COLUMN_ORDER, NEXT_STATUS, COLUMN_ICON_TINT } from "@/components/content/content-board";
import { CATEGORY_META, getCategoryLabel } from "@/lib/content-category-meta";
import { NETWORK_META } from "@/lib/network-meta";
import { updateContentStatusAction } from "@/app/actions/content";
import { DeliverContentDialog } from "@/components/content/deliver-content-dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn, formatTime } from "@/lib/utils";

/** Punto de color por columna, derivado del mismo mapeo de variant que los Badge de estado. */
export const STATUS_DOT: Record<string, string> = {
  secondary: "bg-muted-foreground",
  info: "bg-info",
  warning: "bg-warning",
  destructive: "bg-destructive",
  success: "bg-success",
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
        "glass-card cursor-grab space-y-2.5 rounded-xl p-3 transition-shadow active:cursor-grabbing",
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
  const meta = STATUS_META[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const label = getStatusLabel(status, t);

  return (
    <div className="min-w-0 space-y-2 lg:w-72 lg:shrink-0">
      <div className="flex items-center gap-2 px-1">
        <div className={cn("icon-chip !size-7 !rounded-md", COLUMN_ICON_TINT[meta.variant as string])}>
          <meta.icon className="size-3.5" strokeWidth={1.75} />
        </div>
        <span className="text-sm font-medium">{label}</span>
        <span className="text-muted-foreground ml-auto tabular-nums text-xs">{items.length}</span>
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
      {/* Debajo de "lg" (donde tampoco entra bien un drag horizontal con el
          dedo) las columnas se apilan en una grilla normal — mismo patrón que
          ya usa CrmBoard. El botón "avanzar" de cada tarjeta (PlannerCard)
          sigue moviendo el estado sin necesitar arrastrar, así que ningún
          touch-user pierde funcionalidad acá. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:gap-4 lg:overflow-x-auto lg:pb-2">
        {COLUMN_ORDER.map((status) => (
          <PlannerColumn key={status} status={status} items={grouped.get(status) ?? []} />
        ))}
      </div>
    </DndContext>
  );
}
