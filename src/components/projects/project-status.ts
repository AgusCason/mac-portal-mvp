import type * as React from "react";
import type { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/types/database";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  por_iniciar: "Por iniciar",
  en_curso: "En curso",
  en_pausa: "En pausa",
  completado: "Completado",
  cancelado: "Cancelado",
};

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
