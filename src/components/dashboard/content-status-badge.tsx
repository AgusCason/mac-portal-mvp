import {
  FileEdit,
  Scissors,
  Eye,
  MessageCircleWarning,
  CheckCircle2,
  CalendarClock,
  Rocket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ContentStatus } from "@/types/database";

/** Función de traducción — la misma firma que devuelve `getT()`/`useLocale().t`. */
type TFunc = (path: string, fallback?: string) => string;

const STATUS_META: Record<
  ContentStatus,
  {
    labelKey: string;
    fallback: string;
    icon: typeof FileEdit;
    variant: React.ComponentProps<typeof Badge>["variant"];
  }
> = {
  borrador: { labelKey: "components.contentStatus.borrador", fallback: "Borrador", icon: FileEdit, variant: "secondary" },
  en_edicion: { labelKey: "components.contentStatus.enEdicion", fallback: "En Edición", icon: Scissors, variant: "info" },
  por_aprobar: { labelKey: "components.contentStatus.porAprobar", fallback: "Por Aprobar", icon: Eye, variant: "warning" },
  requiere_cambios: {
    labelKey: "components.contentStatus.requiereCambios",
    fallback: "Requiere Cambios",
    icon: MessageCircleWarning,
    variant: "destructive",
  },
  aprobado: { labelKey: "components.contentStatus.aprobado", fallback: "Aprobado", icon: CheckCircle2, variant: "success" },
  programado: { labelKey: "components.contentStatus.programado", fallback: "Programado", icon: CalendarClock, variant: "info" },
  publicado: { labelKey: "components.contentStatus.publicado", fallback: "Publicado", icon: Rocket, variant: "success" },
};

/**
 * Devuelve la etiqueta traducida de un estado. `t` es opcional para que este
 * módulo lo puedan seguir usando Server Components que todavía no pasan un
 * `t` (cae al español, sin romper nada) — ver `content-status-badge.tsx`.
 */
function getStatusLabel(status: ContentStatus, t?: TFunc): string {
  const meta = STATUS_META[status];
  return t ? t(meta.labelKey, meta.fallback) : meta.fallback;
}

export function ContentStatusBadge({ status, t }: { status: ContentStatus; t?: TFunc }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon />
      {getStatusLabel(status, t)}
    </Badge>
  );
}

export { STATUS_META, getStatusLabel };
export type { TFunc };
