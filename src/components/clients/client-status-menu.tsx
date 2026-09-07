"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, Check } from "lucide-react";

import { updateClientStatusAction } from "@/app/actions/clients";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/i18n/locale-context";
import type { ClientStatus } from "@/types/database";

const STATUS_ORDER: ClientStatus[] = ["active", "paused", "churned"];
const STATUS_BADGE_VARIANT: Record<ClientStatus, "success" | "secondary"> = {
  active: "success",
  paused: "secondary",
  churned: "secondary",
};

/**
 * Badge de estado del cliente (Activo/Pausado/Perdido en la ficha 360),
 * convertido en el control real para cambiarlo — antes era un <Badge>
 * estático y `updateClientStatusAction` no se llamaba desde ningún lado del
 * portal. Pausar/marcar como Perdido es el mecanismo de "archivar": el
 * cliente sale del filtro "Activas" (default) del listado de Cuentas sin
 * borrar ningún dato asociado.
 */
export function ClientStatusMenu({
  clientId,
  status,
}: {
  clientId: string;
  status: ClientStatus;
}) {
  const { t } = useLocale();
  const [current, setCurrent] = React.useState(status);
  const [isPending, startTransition] = useTransition();

  const STATUS_LABEL: Record<ClientStatus, string> = {
    active: t("pages.clienteDetail.statusActive", "Activo"),
    paused: t("pages.clienteDetail.statusPaused", "Pausado"),
    churned: t("pages.clienteDetail.statusLost", "Perdido"),
  };

  function handleSelect(next: ClientStatus) {
    if (next === current || isPending) return;
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      const res = await updateClientStatusAction(clientId, next);
      if (!res.ok) {
        setCurrent(previous);
        toast.error(t("pages.clienteDetail.statusUpdateError", "No se pudo actualizar el estado."));
        return;
      }
      toast.success(t("pages.clienteDetail.statusUpdated", "Estado actualizado."));
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <button type="button" className="inline-flex items-center gap-1 disabled:opacity-60">
          <Badge variant={STATUS_BADGE_VARIANT[current]}>{STATUS_LABEL[current]}</Badge>
          <ChevronDown className="text-muted-foreground size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>{t("pages.clienteDetail.changeStatus", "Cambiar estado")}</DropdownMenuLabel>
        {STATUS_ORDER.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => handleSelect(s)}>
            <Check className={`size-3.5 ${s === current ? "opacity-100" : "opacity-0"}`} />
            {STATUS_LABEL[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
