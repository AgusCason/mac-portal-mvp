"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, MessageSquareWarning, Loader2 } from "lucide-react";

import type { ContentItemWithClient } from "@/lib/queries/content";
import type { ContentStatus, UserRole } from "@/types/database";
import { STATUS_META } from "@/components/dashboard/content-status-badge";
import { NETWORK_META } from "@/lib/network-meta";
import {
  updateContentStatusAction,
  reviewContentAction,
} from "@/app/actions/content";
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
import { formatDate } from "@/lib/utils";

const COLUMN_ORDER: ContentStatus[] = [
  "borrador",
  "en_edicion",
  "por_aprobar",
  "requiere_cambios",
  "aprobado",
  "programado",
  "publicado",
];

// A qué estado pasa una pieza cuando el admin/editor la "avanza" un paso.
const NEXT_STATUS: Partial<Record<ContentStatus, ContentStatus>> = {
  borrador: "en_edicion",
  en_edicion: "por_aprobar",
  requiere_cambios: "en_edicion",
  aprobado: "programado",
  programado: "publicado",
};

function RequestChangesDialog({ contentId }: { contentId: string }) {
  const [feedback, setFeedback] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const res = await reviewContentAction(contentId, "requiere_cambios", feedback);
      if (res.ok) {
        toast.success("Cambios solicitados");
        setOpen(false);
        setFeedback("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageSquareWarning /> Pedir cambios
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pedir cambios</DialogTitle>
          <DialogDescription>
            Contale al equipo qué te gustaría ajustar en esta pieza.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="feedback">Feedback</Label>
          <Input
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Ej: cambiar el audio de fondo, acortar el intro..."
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending || !feedback.trim()}>
            {isPending && <Loader2 className="animate-spin" />}
            Enviar
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const network = NETWORK_META[item.network];
  const NetworkIcon = network.icon;

  function advance() {
    const next = NEXT_STATUS[item.status];
    if (!next) return;
    startTransition(async () => {
      const res = await updateContentStatusAction(item.id, next);
      if (res.ok) {
        toast.success(`Movido a "${STATUS_META[next].label}"`);
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
        toast.success("¡Aprobado!");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex items-start justify-between gap-2 text-sm font-medium">
          <span className="line-clamp-2">{item.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <NetworkIcon className="size-3.5" />
          {network.label}
        </div>
        {role !== "client" && (
          <p className="text-muted-foreground truncate text-xs">{item.client_name}</p>
        )}
        {item.scheduled_at && (
          <p className="text-muted-foreground tabular-nums text-xs">
            Programado: {formatDate(item.scheduled_at)}
          </p>
        )}

        {(role === "admin" || role === "editor") && NEXT_STATUS[item.status] && (
          <Button size="sm" variant="secondary" onClick={advance} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            Mover a {STATUS_META[NEXT_STATUS[item.status]!].label}
          </Button>
        )}

        {role === "client" && item.status === "por_aprobar" && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={approve} disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : <Check />}
              Aprobar
            </Button>
            <RequestChangesDialog contentId={item.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Tablero Kanban del calendario editorial. La misma pieza sirve para las
 * tres rutas (/admin/calendario, /editor/calendario, /client/calendario):
 * lo que cambia es qué acciones puede tomar cada rol sobre cada tarjeta.
 */
export function ContentBoard({
  items,
  role,
}: {
  items: ContentItemWithClient[];
  role: UserRole;
}) {
  const grouped = React.useMemo(() => {
    const map = new Map<ContentStatus, ContentItemWithClient[]>();
    for (const status of COLUMN_ORDER) map.set(status, []);
    for (const item of items) map.get(item.status)?.push(item);
    return map;
  }, [items]);

  return (
    <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-[16rem]">
      {COLUMN_ORDER.map((status) => {
        const columnItems = grouped.get(status) ?? [];
        const meta = STATUS_META[status];
        return (
          <div key={status} className="min-w-0 lg:w-64">
            <div className="mb-2 flex items-center justify-between px-1">
              <Badge variant={meta.variant}>
                <meta.icon /> {meta.label}
              </Badge>
              <span className="text-muted-foreground tabular-nums text-xs">
                {columnItems.length}
              </span>
            </div>
            <div className="space-y-2">
              {columnItems.length === 0 && (
                <p className="text-muted-foreground px-1 text-xs">Sin piezas</p>
              )}
              {columnItems.map((item) => (
                <ContentCard key={item.id} item={item} role={role} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
