"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Users, Loader2 } from "lucide-react";

import { setToolAccessAction } from "@/app/actions/tools";
import type { ToolAccessEditor } from "@/lib/queries/tools";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Profile } from "@/types/database";

/**
 * Compartir una herramienta — selección múltiple de editores + un botón
 * "Todo el equipo" que solo marca todos los checkboxes de una (sigue siendo
 * la misma lista final al guardar, ver `setToolAccessAction`). No hay un
 * concepto de "grupo" persistente: es siempre la lista de editores vigente
 * en el momento de guardar.
 */
export function ShareToolDialog({
  toolId,
  toolName,
  editors,
  sharedWith,
}: {
  toolId: string;
  toolName: string;
  editors: Profile[];
  sharedWith: ToolAccessEditor[];
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(sharedWith.map((e) => e.editorId))
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleOpenChange(next: boolean) {
    if (next) setSelected(new Set(sharedWith.map((e) => e.editorId)));
    setOpen(next);
  }

  function toggle(editorId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(editorId)) next.delete(editorId);
      else next.add(editorId);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(editors.map((e) => e.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function submit() {
    startTransition(async () => {
      const res = await setToolAccessAction(toolId, Array.from(selected));
      if (res.ok) {
        toast.success(t("components.tools.accessSaved", "Accesos actualizados"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Users /> {t("components.tools.share", "Compartir")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("components.tools.shareTitle", "Compartir")} &quot;{toolName}&quot;
          </DialogTitle>
          <DialogDescription>
            {t(
              "components.tools.shareDesc",
              "Elegí qué editores pueden ver el link y la contraseña de esta herramienta."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={selectAll} disabled={editors.length === 0}>
            {t("components.tools.selectAll", "Todo el equipo")}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={clearAll}>
            {t("components.tools.clearAll", "Ninguno")}
          </Button>
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
          {editors.length === 0 && (
            <p className="text-muted-foreground p-2 text-sm">
              {t("components.tools.noEditors", "Todavía no hay editores en el equipo.")}
            </p>
          )}
          {editors.map((e) => (
            <label
              key={e.id}
              className="hover:bg-accent/50 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
            >
              <Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggle(e.id)} />
              <span className="min-w-0 flex-1 truncate">{e.full_name || e.email}</span>
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {t("common.save", "Guardar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
