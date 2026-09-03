import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { STATUS_META, getStatusLabel, type TFunc } from "@/components/dashboard/content-status-badge";
import type { ContentStatus } from "@/types/database";

const STATUS_ORDER: ContentStatus[] = [
  "borrador",
  "en_edicion",
  "por_aprobar",
  "requiere_cambios",
  "aprobado",
  "programado",
  "publicado",
];

/**
 * "Contenido por estado" — última iteración del mockup aprobado: barras
 * horizontales con el ícono de cada estado (mismos íconos de
 * `content-status-badge.tsx`) y el valor siempre visible al lado, en vez
 * de las barras verticales con tooltip on-hover de antes. Con el valor ya
 * legible sin pasar el mouse no hace falta la interacción — mismo eje real
 * del portal (7 ESTADOS del pipeline editorial, `contentByStatus`).
 */
export function ContentStatusChart({
  contentByStatus,
  t,
  title,
  description,
}: {
  contentByStatus: Record<ContentStatus, number>;
  t: TFunc;
  title: string;
  description: string;
}) {
  const max = Math.max(1, ...STATUS_ORDER.map((s) => contentByStatus[s] ?? 0));

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="icon-chip">
          <BarChart3 className="size-4" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {STATUS_ORDER.map((status) => {
          const value = contentByStatus[status] ?? 0;
          const widthPct = Math.max(4, Math.round((value / max) * 100));
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          return (
            <div key={status} className="flex items-center gap-3">
              <span className="icon-chip !size-7 !rounded-md">
                <Icon className="size-3.5" strokeWidth={1.75} />
              </span>
              <span className="w-[132px] shrink-0 text-[11.5px] font-semibold">
                {getStatusLabel(status, t)}
              </span>
              <div className="bg-accent/60 h-2 flex-1 overflow-hidden rounded-full">
                <span
                  className="bg-primary/80 block h-full rounded-full"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums">
                {value}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
