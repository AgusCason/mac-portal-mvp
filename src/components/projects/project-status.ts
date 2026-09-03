import type * as React from "react";
import { Circle, PlayCircle, PauseCircle, CheckCircle2, XCircle } from "lucide-react";
import type { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/types/database";

type TFunc = (path: string, fallback?: string) => string;

const PROJECT_STATUS_META: Record<ProjectStatus, { labelKey: string; fallback: string; icon: typeof Circle }> = {
  por_iniciar: { labelKey: "components.projects.statusPorIniciar", fallback: "Por iniciar", icon: Circle },
  en_curso: { labelKey: "components.projects.statusEnCurso", fallback: "En curso", icon: PlayCircle },
  en_pausa: { labelKey: "components.projects.statusEnPausa", fallback: "En pausa", icon: PauseCircle },
  completado: { labelKey: "components.projects.statusCompletado", fallback: "Completado", icon: CheckCircle2 },
  cancelado: { labelKey: "components.projects.statusCancelado", fallback: "Cancelado", icon: XCircle },
};

/** Ícono de cada estado — usado en el icon-chip del header de columna del Kanban. */
export const PROJECT_STATUS_ICON: Record<ProjectStatus, typeof Circle> = {
  por_iniciar: PROJECT_STATUS_META.por_iniciar.icon,
  en_curso: PROJECT_STATUS_META.en_curso.icon,
  en_pausa: PROJECT_STATUS_META.en_pausa.icon,
  completado: PROJECT_STATUS_META.completado.icon,
  cancelado: PROJECT_STATUS_META.cancelado.icon,
};

/** Devuelve la etiqueta traducida de un estado de proyecto. Sin `t`, cae al fallback en español. */
export function getProjectStatusLabel(status: ProjectStatus, t?: TFunc): string {
  const meta = PROJECT_STATUS_META[status];
  return t ? t(meta.labelKey, meta.fallback) : meta.fallback;
}

export const PROJECT_STATUS_VARIANT: Record<
  ProjectStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  por_iniciar: "secondary",
  en_curso: "info",
  en_pausa: "warning",
  completado: "success",
  cancelado: "destructive",
};

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "por_iniciar",
  "en_curso",
  "en_pausa",
  "completado",
  "cancelado",
];
