"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, MessageSquareWarning, Loader2, GripVertical } from "lucide-react";
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
import type { ContentStatus, UserRole } from "@/types/database";
import { STATUS_META, getStatusLabel } from "@/components/dashboard/content-status-badge";
import { NETWORK_META } from "@/lib/network-meta";
import {
  updateContentStatusAction,
  reviewContentAction,
} from "@/app/actions/content";
import { DeliverContentDialog } from "@/components/content/deliver-content-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn, formatDate } from "@/lib/utils";

export const COLUMN_ORDER: ContentStatus[] = [
  "borrador",
  "en_edicion",
  "por_aprobar",
  "requiere_cambios",
  "aprobado",
  "programado",
  "publicado",
];

// A qué estado pasa una pieza cuando el admin/editor la "avanza" un paso.
// De "en_edicion" no se avanza con este botón genérico: pasa por el modal
// de entrega (`DeliverContentDialog`), que sube el render a Drive y recién
// ahí transiciona a "por_aprobar" — así nunca queda una pieza "aprobable"
// sin archivo real entregado.
export const NEXT_STATUS: Partial<Record<ContentStatus, ContentStatus>> = {
  borrador: "en_edicion",
  requiere_cambios: "en_edicion",
  aprobado: "programado",
  programado: "publicado",
};

function RequestChangesDialog({
  contentId,
  contentTitle,
  driveFileId,
}: {
  contentId: string;
  contentTitle: string;
  driveFileId: string | null;
}) {
  const { t } = useLocale();
  const [feedback, setFeedback] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const res = await reviewContentAction(contentId, "requiere_cambios", feedback);
      if (res.ok) {
        toast.success(t("components.content.changesRequested", "Cambios solicitados"));
        setOpen(false);
        setFeedback("");
        // Redirige al chat con la agencia con un mensaje prearmado —
        // así el pedido de ajustes no se pierde entre la pieza y el chat.
        const videoRef = driveFileId
          ? `https://drive.google.com/file/d/${driveFileId}/view`
          : `ID ${contentId}`;
        const prefill = `${t("components.content.changeRequestPrefix", "Pedido de ajustes en")} "${contentTitle}" (${videoRef}): ${feedback}`;
        router.push(`/client/chat?prefill=${encodeURIComponent(prefill)}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageSquareWarning /> {t("components.content.requestChanges", "Pedir cambios")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("components.content.requestChangesTitle", "Pedir cambios")}</DialogTitle>
          <DialogDescription>
            {t("components.content.requestChangesDesc", "Contale al equipo qué te gustaría ajustar en esta pieza.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="feedback">{t("components.content.feedbackLabel", "Feedback")}</Label>
          <Input
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t("components.content.feedbackPlaceholder", "Ej: cambiar el audio de fondo, acortar el intro...")}
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending || !feedback.trim()}>
            {isPending && <Loader2 className="animate-spin" />}
            {t("components.content.send", "Enviar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContentCard({
  item,
  role,
}: {
  item: ContentItemWithClient;
  role: UserRole;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const network = NETWORK_META[item.network];
  const NetworkIcon = network.icon;
  const draggable = role === "admin" || role === "editor";
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { status: item.status },
    disabled: !draggable,
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

  function approve() {
    startTransition(async () => {
      const res = await reviewContentAction(item.id, "aprobado");
      if (res.ok) {
        toast.success(t("components.content.approved", "¡Aprobado!"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "gap-3 py-4 transition-shadow duration-150 hover:shadow-md",
        isDragging && "z-50 opacity-60 shadow-lg"
      )}
    >
      <CardHeader className="px-4">
        <CardTitle className="flex items-start justify-between gap-2 text-sm font-medium">
          <span className="line-clamp-2">{item.title}</span>
          {draggable && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground shrink-0 cursor-grab touch-none active:cursor-grabbing"
              aria-label={t("components.content.dragToChangeStatus", "Arrastrar para cambiar de estado")}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span className="bg-accent flex size-6 shrink-0 items-center justify-center rounded-full">
            <NetworkIcon className="size-3.5" />
          </span>
          {network.label}
        </div>
        {role !== "client" && (
          <p className="text-muted-foreground truncate text-xs">{item.client_name}</p>
        )}
        {item.scheduled_at && (
          <p className="text-muted-foreground tabular-nums text-xs">
            {t("components.content.scheduledPrefix", "Programado")}: {formatDate(item.scheduled_at)}
          </p>
        )}

        {(role === "admin" || role === "editor") && item.status === "en_edicion" && (
          <DeliverContentDialog contentId={item.id} clientId={item.client_id} title={item.title} />
        )}

        {(role === "admin" || role === "editor") && NEXT_STATUS[item.status] && (
          <Button size="sm" variant="secondary" onClick={advance} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            {t("components.content.moveTo", "Mover a")} {getStatusLabel(NEXT_STATUS[item.status]!, t)}
          </Button>
        )}

        {role === "client" && item.status === "por_aprobar" && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={approve} disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : <Check />}
              {t("components.content.approve", "Aprobar")}
            </Button>
            <RequestChangesDialog
              contentId={item.id}
              contentTitle={item.title}
              driveFileId={item.drive_file_id}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BoardColumn({
  status,
  items,
  role,
}: {
  status: ContentStatus;
  items: ContentItemWithClient[];
  role: UserRole;
}) {
  const { t } = useLocale();
  const meta = STATUS_META[status];
  const draggable = role === "admin" || role === "editor";
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: !draggable });

  return (
    <div className="min-w-0 lg:w-64 lg:shrink-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <Badge variant={meta.variant}>
          <meta.icon /> {getStatusLabel(status, t)}
        </Badge>
        <span className="text-muted-foreground tabular-nums text-xs">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-16 space-y-2 rounded-lg transition-colors duration-150",
          isOver && "bg-accent/60 ring-1 ring-inset ring-border"
        )}
      >
        {items.length === 0 && <p className="text-muted-foreground px-1 text-xs">{t("components.content.noPieces", "Sin piezas")}</p>}
        {items.map((item) => (
          <ContentCard key={item.id} item={item} role={role} />
        ))}
      </div>
    </div>
  );
}

/**
 * Tablero Kanban del calendario editorial. La misma pieza sirve para las
 * tres rutas (/admin/calendario, /editor/calendario, /client/calendario):
 * lo que cambia es qué acciones puede tomar cada rol sobre cada tarjeta.
 * Admin/editor además pueden arrastrar tarjetas entre columnas (Fase 2.3) —
 * excepto hacia "Por Aprobar", que sigue exigiendo el modal de Entrega para
 * garantizar que la pieza aprobable siempre tenga un archivo real adjunto.
 */
export function ContentBoard({
  items,
  role,
}: {
  items: ContentItemWithClient[];
  role: UserRole;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [clientFilter, setClientFilter] = React.useState("all");
  const [networkFilter, setNetworkFilter] = React.useState("all");

  const clientOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) map.set(item.client_id, item.client_name);
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [items]);

  const networkOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const item of items) set.add(item.network);
    return Array.from(set) as (typeof items)[number]["network"][];
  }, [items]);

  const filteredItems = React.useMemo(() => {
    return items.filter(
      (item) =>
        (clientFilter === "all" || item.client_id === clientFilter) &&
        (networkFilter === "all" || item.network === networkFilter)
    );
  }, [items, clientFilter, networkFilter]);

  const grouped = React.useMemo(() => {
    const map = new Map<ContentStatus, ContentItemWithClient[]>();
    for (const status of COLUMN_ORDER) map.set(status, []);
    for (const item of filteredItems) map.get(item.status)?.push(item);
    return map;
  }, [filteredItems]);

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
      toast.error(t("components.content.approveViaDeliverError", 'Para pasar a "Por Aprobar" usá el botón Entregar de la pieza (sube el archivo).'));
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
    <div className="space-y-3">
      {(clientOptions.length > 1 || networkOptions.length > 1) && (
        <div className="flex flex-wrap items-center gap-2">
          {clientOptions.length > 1 && (
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger size="sm" className="w-44">
                <SelectValue placeholder={t("components.content.clientLabel", "Cliente")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("components.content.allClients", "Todos los clientes")}</SelectItem>
                {clientOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {networkOptions.length > 1 && (
            <Select value={networkFilter} onValueChange={setNetworkFilter}>
              <SelectTrigger size="sm" className="w-44">
                <SelectValue placeholder={t("components.content.networkLabel", "Red")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("components.content.allNetworks", "Todas las redes")}</SelectItem>
                {networkOptions.map((n) => (
                  <SelectItem key={n} value={n}>
                    {NETWORK_META[n].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:overflow-x-auto lg:pb-2">
          {COLUMN_ORDER.map((status) => (
            <BoardColumn key={status} status={status} items={grouped.get(status) ?? []} role={role} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
