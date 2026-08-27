"use client";

import * as React from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";

import { updateModuleFlagAction } from "@/app/actions/module-flags";
import {
  MODULES_CATALOG,
  findModuleByKey,
  getModuleLabel,
  getModuleDescription,
  getModuleAreaLabel,
  getModuleCategoryLabel,
} from "@/lib/modules-catalog";
import type { ModuleFlag } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useLocale } from "@/lib/i18n/locale-context";

type Field = "enabled" | "visible_to_editor" | "visible_to_client";

function FlagSwitch({
  moduleKey,
  field,
  checked,
  label,
  disabled,
  disabledReason,
}: {
  moduleKey: string;
  field: Field;
  checked: boolean;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  // Sin useEffect+setState para re-sincronizar `checked`: en vez de eso, el
  // padre nos remonta con `key={String(checked)}` cuando el prop cambia de
  // verdad (nueva carga del server) — así el estado optimista local nunca
  // pisa una actualización externa real, y evitamos el patrón de cascading
  // renders que ya generó un error de lint en otro componente de esta app.
  const [value, setValue] = React.useState(checked);
  const [isPending, startTransition] = React.useTransition();

  function handleChange(next: boolean) {
    setValue(next);
    startTransition(async () => {
      const res = await updateModuleFlagAction(moduleKey, field, next);
      if (!res.ok) {
        setValue(!next);
        toast.error(res.error);
      }
    });
  }

  const control = (
    <label className="flex items-center gap-1.5 text-xs">
      <Switch
        checked={value}
        onCheckedChange={handleChange}
        disabled={disabled || isPending}
        className="scale-90"
      />
      <span className="text-muted-foreground">{label}</span>
    </label>
  );

  if (disabled && disabledReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{control}</TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    );
  }
  return control;
}

function ModuleRow({ moduleKey, flag }: { moduleKey: string; flag: ModuleFlag | undefined }) {
  const { t } = useLocale();
  const mod = MODULES_CATALOG.flatMap((c) => c.modules).find((m) => m.key === moduleKey);
  if (!mod) return null;

  const isModulesPanel = moduleKey === "config-modulos";
  const isComingSoon = mod.status === "proximamente";
  const enabled = flag?.enabled ?? true;
  const visibleEditor = flag?.visible_to_editor ?? true;
  const visibleClient = flag?.visible_to_client ?? true;

  return (
    <div className="border-border flex flex-col gap-3 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{getModuleLabel(mod, t)}</p>
          {isComingSoon && <Badge variant="secondary">{t("components.config.comingSoon", "Próximamente")}</Badge>}
          {!enabled && !isComingSoon && <Badge variant="destructive">{t("components.config.turnedOff", "Apagado")}</Badge>}
        </div>
        <p className="text-muted-foreground max-w-md text-xs">{getModuleDescription(mod, t)}</p>
        {mod.dependsOn && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            {t("components.config.dependsOnPrefix", "Depende de:")}{" "}
            {(() => {
              const dep = findModuleByKey(mod.dependsOn);
              return dep ? getModuleLabel(dep, t) : mod.dependsOn;
            })()}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:shrink-0">
        <FlagSwitch
          key={`enabled-${enabled}`}
          moduleKey={moduleKey}
          field="enabled"
          checked={enabled}
          label={t("components.config.activeLabel", "Activo")}
          disabled={isComingSoon || isModulesPanel}
          disabledReason={
            isModulesPanel
              ? t(
                  "components.config.modulesPanelDisabledReason",
                  "Este panel no se puede apagar — quedarías sin forma de volver a prenderlo."
                )
              : undefined
          }
        />
        <FlagSwitch
          key={`visible_to_editor-${visibleEditor}`}
          moduleKey={moduleKey}
          field="visible_to_editor"
          checked={visibleEditor}
          label={t("components.config.editorLabel", "Editor")}
          disabled={isComingSoon || !enabled}
        />
        <FlagSwitch
          key={`visible_to_client-${visibleClient}`}
          moduleKey={moduleKey}
          field="visible_to_client"
          checked={visibleClient}
          label={t("components.config.clientLabel", "Cliente")}
          disabled={isComingSoon || !enabled}
        />
      </div>
    </div>
  );
}

/**
 * Configuración > Módulos — Fase F2: ya no es solo informativo. "Activo"
 * apaga el módulo para todos (incluido admin, salvo este mismo panel).
 * "Editor"/"Cliente" controlan si ese rol lo ve en su sidebar y puede entrar
 * por URL — no aplican a admin, que ve todo lo que esté Activo.
 */
export function ModulosPanel({ flags }: { flags: Record<string, ModuleFlag> }) {
  const { t } = useLocale();
  const areas = Array.from(new Set(MODULES_CATALOG.map((c) => c.area)));

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="text-muted-foreground flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <p>
            {t(
              "components.config.flagsInfoText",
              '"Activo" apaga el módulo para toda la plataforma (incluido vos). "Editor" y "Cliente" solo ocultan el módulo para esos roles — lo sigue viendo el admin.'
            )}
          </p>
        </div>

        {areas.map((area) => (
          <Card key={area}>
            <CardHeader>
              <CardTitle>{getModuleAreaLabel(area, t)}</CardTitle>
              <CardDescription>
                {MODULES_CATALOG.filter((c) => c.area === area).reduce(
                  (sum, c) => sum + c.modules.length,
                  0
                )}{" "}
                {t("components.config.modulesCountSuffix", "módulos")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {MODULES_CATALOG.filter((c) => c.area === area).map((cat) => (
                <div key={cat.category}>
                  <p className="mb-1 text-sm font-medium">{getModuleCategoryLabel(cat.category, t)}</p>
                  <div>
                    {cat.modules.map((m) => (
                      <ModuleRow key={m.key} moduleKey={m.key} flag={flags[m.key]} />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
