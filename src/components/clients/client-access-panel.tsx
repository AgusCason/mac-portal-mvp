"use client";

import * as React from "react";
import { toast } from "sonner";
import { Info, RotateCcw } from "lucide-react";

import { updateClientModuleAccessAction } from "@/app/actions/client-module-overrides";
import { findModuleByKey, getModuleLabel, getModuleDescription } from "@/lib/modules-catalog";
import type { ModuleFlag } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Módulos del Portal de Clientes que se pueden dar/sacar por cliente puntual
 * — deben coincidir con los `href` de `NAV_CONFIG.client` (nav-config.ts) /
 * `ROUTE_MODULE_MAP` para las rutas /client/*. Dashboard queda afuera a
 * propósito: no tiene módulo propio, siempre es visible.
 */
const CLIENT_PORTAL_MODULE_KEYS = [
  "calendario",
  "drive",
  "contratos",
  "reportes-ia",
  "planes-facturacion",
  "sitios-web",
  "chat",
] as const;

function AccessRow({
  clientId,
  moduleKey,
  flag,
  override,
}: {
  clientId: string;
  moduleKey: string;
  flag: ModuleFlag | undefined;
  override: boolean | undefined;
}) {
  const { t } = useLocale();
  const mod = findModuleByKey(moduleKey);
  const [isPending, startTransition] = React.useTransition();
  // Sin useEffect+setState para re-sincronizar: el padre nos remonta con
  // `key` cuando `override` cambia de verdad (revalidatePath tras la Server
  // Action) — mismo patrón que ModulosPanel (components/config/modulos-panel.tsx).
  const [localOverride, setLocalOverride] = React.useState(override);

  if (!mod) return null;

  const killedGlobally = flag ? !flag.enabled : false;
  const defaultVisible = flag?.visible_to_client ?? true;
  const effective = localOverride ?? defaultVisible;
  const hasOverride = localOverride !== undefined;

  function handleChange(next: boolean) {
    setLocalOverride(next);
    startTransition(async () => {
      const res = await updateClientModuleAccessAction(clientId, moduleKey, next);
      if (!res.ok) {
        setLocalOverride(override);
        toast.error(res.error);
      }
    });
  }

  function handleReset() {
    const prev = localOverride;
    setLocalOverride(undefined);
    startTransition(async () => {
      const res = await updateClientModuleAccessAction(clientId, moduleKey, null);
      if (!res.ok) {
        setLocalOverride(prev);
        toast.error(res.error);
      }
    });
  }

  const control = (
    <div className="flex items-center gap-2">
      <Switch checked={effective} onCheckedChange={handleChange} disabled={killedGlobally || isPending} />
      <span className="text-muted-foreground w-12 text-xs">
        {effective
          ? t("components.config.clientAccess.visibleLabel", "Visible")
          : t("components.config.clientAccess.hiddenLabel", "Oculto")}
      </span>
    </div>
  );

  return (
    <div className="border-border flex flex-col gap-3 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{getModuleLabel(mod, t)}</p>
          {killedGlobally && (
            <Badge variant="destructive">
              {t("components.config.clientAccess.offPlatformBadge", "Apagado para todos")}
            </Badge>
          )}
          {!killedGlobally && hasOverride && (
            <Badge variant="info">{t("components.config.clientAccess.customBadge", "Personalizado")}</Badge>
          )}
        </div>
        <p className="text-muted-foreground max-w-md text-xs">{getModuleDescription(mod, t)}</p>
      </div>
      <div className="flex items-center gap-3 sm:shrink-0">
        {killedGlobally ? (
          <Tooltip>
            <TooltipTrigger asChild>{control}</TooltipTrigger>
            <TooltipContent>
              {t(
                "components.config.clientAccess.offPlatformReason",
                "Este módulo está apagado en Configuración > Módulos para toda la plataforma — no se puede dar acceso puntual a un cliente mientras esté así."
              )}
            </TooltipContent>
          </Tooltip>
        ) : (
          control
        )}
        {!killedGlobally && hasOverride && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
            className="text-muted-foreground h-7 px-2 text-xs"
          >
            <RotateCcw className="mr-1 size-3" />
            {t("components.config.clientAccess.reset", "Restablecer")}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Ficha de cliente > pestaña Accesos (Fase F3) — a diferencia de
 * Configuración > Módulos (general, para toda la plataforma), acá el admin
 * da o saca acceso a un módulo del Portal de Clientes para ESTE cliente
 * puntual. Solo lista los módulos que ya existen como ítem del sidebar del
 * cliente — el resto de module_flags (Editor, módulos internos de la
 * agencia) no aplica acá y sigue viviendo solo en Configuración > Módulos.
 */
export function ClientAccessPanel({
  clientId,
  flags,
  overrides,
}: {
  clientId: string;
  flags: Record<string, ModuleFlag>;
  overrides: Record<string, boolean>;
}) {
  const { t } = useLocale();

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="text-muted-foreground flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <p>
            {t(
              "components.config.clientAccess.infoText",
              "Esto es aparte de Configuración > Módulos: ahí definís qué ve cada rol en general, acá le das o sacás acceso a un módulo puntual solo para este cliente."
            )}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("pages.clienteDetail.tabAccess", "Accesos")}</CardTitle>
            <CardDescription>
              {t("pages.clienteDetail.portalUser", "Usuario del portal cliente")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {CLIENT_PORTAL_MODULE_KEYS.map((key) => (
              <AccessRow
                key={`${key}-${String(overrides[key])}`}
                clientId={clientId}
                moduleKey={key}
                flag={flags[key]}
                override={overrides[key]}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
