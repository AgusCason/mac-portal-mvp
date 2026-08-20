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

const STATUS_META: Record<
  ContentStatus,
  { label: string; icon: typeof FileEdit; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  borrador: { label: "Borrador", icon: FileEdit, variant: "secondary" },
  en_edicion: { label: "En Edición", icon: Scissors, variant: "info" },
  por_aprobar: { label: "Por Aprobar", icon: Eye, variant: "warning" },
  requiere_cambios: {
    label: "Requiere Cambios",
    icon: MessageCircleWarning,
    variant: "destructive",
  },
  aprobado: { label: "Aprobado", icon: CheckCircle2, variant: "success" },
  programado: { label: "Programado", icon: CalendarClock, variant: "info" },
  publicado: { label: "Publicado", icon: Rocket, variant: "success" },
};

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon />
      {meta.label}
    </Badge>
  );
}

export { STATUS_META };
