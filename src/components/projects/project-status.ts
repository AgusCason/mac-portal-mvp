import type * as React from "react";
import type { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/types/database";

type TFunc = (path: string, fallback?: string) => string;

const PROJECT_STATUS_META: Record<ProjectStatus, { labelKey: string; fallback: string }> = {
  por_iniciar: { labelKey: "components.projects.statusPorIniciar", fallback: "Por iniciar" },
  en_curso: { labelKey: "components.projects.statusEnCurso", fallback: "En curso" },
  en_pausa: { labelKey: "components.projects.statusEnPausa", fallback: "En pausa" },
  completado: { labelKey: "components.projects.statusCompletado", fallback: "Completado" },
  cancelado: { labelKey: "components.projects.statusCancelado", fallback: "Cancelado" },
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
