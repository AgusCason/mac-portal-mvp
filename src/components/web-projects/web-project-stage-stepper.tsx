"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

import { updateWebProjectStageAction } from "@/app/actions/web-projects";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import type { WebProjectStage } from "@/types/database";
import {
  WEB_PROJECT_STAGE_ALL,
  WEB_PROJECT_STAGE_FLOW,
  WEB_PROJECT_STAGE_VARIANT,
  getWebProjectStageLabel,
} from "@/components/web-projects/web-project-stage";

/**
 * Barra de avance de un proyecto de Sitios Web — las 6 etapas del flujo
 * normal (Brief → Mantenimiento), con la actual resaltada. Si el proyecto
 * está en una etapa de excepción (Pausado/Cancelado) se muestra un badge en
 * su lugar, ya que esas dos no forman parte de la progresión lineal.
 */
export function WebProjectStageStepper({ stage }: { stage: WebProjectStage }) {
  const { t } = useLocale();

  if (stage === "pausado" || stage === "cancelado") {
    return (
      <Badge variant={WEB_PROJECT_STAGE_VARIANT[stage]}>{getWebProjectStageLabel(stage, t)}</Badge>
    );
  }

  const currentIndex = WEB_PROJECT_STAGE_FLOW.indexOf(stage);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {WEB_PROJECT_STAGE_FLOW.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <React.Fragment key={s}>
            {i > 0 && (
              <div className={cn("h-px w-4 shrink-0 sm:w-8", done || active ? "bg-foreground" : "bg-border")} />
            )}
            <div className="flex shrink-0 items-center gap-1.5">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  done && "bg-foreground text-background",
                  active && "ring-foreground/70 ring-2 ring-offset-2 ring-offset-background",
                  active && !done && "bg-accent text-foreground",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-sm whitespace-nowrap",
                  active ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {getWebProjectStageLabel(s, t)}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** Selector de etapa para el admin (incluye Pausado/Cancelado). */
export function WebProjectStageSelect({
  projectId,
  stage,
}: {
  projectId: string;
  stage: WebProjectStage;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      const res = await updateWebProjectStageAction(projectId, value as WebProjectStage);
      if (res.ok) {
        toast.success(t("components.webProjects.stageUpdated", "Etapa actualizada"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={stage} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WEB_PROJECT_STAGE_ALL.map((s) => (
            <SelectItem key={s} value={s}>
              {getWebProjectStageLabel(s, t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
    </div>
  );
}
