import type * as React from "react";
import type { Badge } from "@/components/ui/badge";
import type { WebAssetStatus, WebProjectStage } from "@/types/database";

type TFunc = (path: string, fallback?: string) => string;

const WEB_PROJECT_STAGE_META: Record<WebProjectStage, { labelKey: string; fallback: string }> = {
  brief: { labelKey: "components.webProjects.stageBrief", fallback: "Relevamiento inicial" },
  diseno: { labelKey: "components.webProjects.stageDiseno", fallback: "Diseño" },
  desarrollo: { labelKey: "components.webProjects.stageDesarrollo", fallback: "Desarrollo" },
  qa: { labelKey: "components.webProjects.stageQa", fallback: "Control de calidad" },
  lanzamiento: { labelKey: "components.webProjects.stageLanzamiento", fallback: "Lanzamiento" },
  mantenimiento: { labelKey: "components.webProjects.stageMantenimiento", fallback: "Mantenimiento" },
  pausado: { labelKey: "components.webProjects.stagePausado", fallback: "Pausado" },
  cancelado: { labelKey: "components.webProjects.stageCancelado", fallback: "Cancelado" },
};

/** Devuelve la etiqueta traducida de una etapa de proyecto web. Sin `t`, cae al fallback en español. */
export function getWebProjectStageLabel(stage: WebProjectStage, t?: TFunc): string {
  const meta = WEB_PROJECT_STAGE_META[stage];
  return t ? t(meta.labelKey, meta.fallback) : meta.fallback;
}

export const WEB_PROJECT_STAGE_VARIANT: Record<
  WebProjectStage,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  brief: "secondary",
  diseno: "info",
  desarrollo: "info",
  qa: "warning",
  lanzamiento: "success",
  mantenimiento: "secondary",
  pausado: "warning",
  cancelado: "destructive",
};

/** Etapas del flujo normal de un proyecto web, en orden — usadas por el stepper. */
export const WEB_PROJECT_STAGE_FLOW: WebProjectStage[] = [
  "brief",
  "diseno",
  "desarrollo",
  "qa",
  "lanzamiento",
  "mantenimiento",
];

/** Todas las etapas seleccionables desde el panel de admin (incluye las 2 de excepción). */
export const WEB_PROJECT_STAGE_ALL: WebProjectStage[] = [...WEB_PROJECT_STAGE_FLOW, "pausado", "cancelado"];

const WEB_ASSET_STATUS_META: Record<WebAssetStatus, { labelKey: string; fallback: string }> = {
  pendiente: { labelKey: "components.webProjects.statusPendiente", fallback: "Pendiente" },
  aprobado: { labelKey: "components.webProjects.statusAprobado", fallback: "Aprobado" },
  requiere_cambios: { labelKey: "components.webProjects.statusRequiereCambios", fallback: "Requiere cambios" },
};

export function getWebAssetStatusLabel(status: WebAssetStatus, t?: TFunc): string {
  const meta = WEB_ASSET_STATUS_META[status];
  return t ? t(meta.labelKey, meta.fallback) : meta.fallback;
}

export const WEB_ASSET_STATUS_VARIANT: Record<WebAssetStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  pendiente: "secondary",
  aprobado: "success",
  requiere_cambios: "warning",
};
