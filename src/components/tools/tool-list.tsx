"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Wrench, Eye, EyeOff, Copy, Pencil, Trash2, Loader2, Plus } from "lucide-react";

import type { AgencyToolWithAccess } from "@/lib/queries/tools";
import {
  createToolAction,
  updateToolAction,
  deleteToolAction,
  revealToolPasswordAction,
} from "@/app/actions/tools";
import { ShareToolDialog } from "@/components/tools/share-tool-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getDateUrgency, URGENCY_BADGE } from "@/lib/finance-utils";
import type { Profile } from "@/types/database";

function ToolFormFields({
  tool,
  passwordRequired,
}: {
  tool?: AgencyToolWithAccess;
  passwordRequired: boolean;
}) {
  const { t } = useLocale();
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("components.tools.nameLabel", "Nombre")}</Label>
        <Input id="name" name="name" required defaultValue={tool?.name} placeholder={t("components.tools.namePlaceholder", "Ej: Canva")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="purpose">{t("components.tools.purposeLabel", "Para qué es")}</Label>
        <Input
          id="purpose"
          name="purpose"
          defaultValue={tool?.purpose ?? ""}
          placeholder={t("components.tools.purposePlaceholder", "Ej: Diseño de piezas para redes")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="url">{t("components.tools.urlLabel", "Link")}</Label>
        <Input id="url" name="url" type="url" defaultValue={tool?.url ?? ""} placeholder="https://" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="accountEmail">{t("components.tools.accountEmailLabel", "Mail de la cuenta")}</Label>
          <Input id="accountEmail" name="accountEmail" type="email" defaultValue={tool?.account_email ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">
            {passwordRequired
              ? t("components.tools.passwordLabel", "Contraseña")
              : t("components.tools.passwordLabelOptional", "Contraseña (dejar vacío para no cambiarla)")}
          </Label>
          <Input id="password" name="password" type="password" required={passwordRequired} placeholder="••••••••" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">{t("components.tools.notesLabel", "Notas")}</Label>
        <Input id="notes" name="notes" defaultValue={tool?.notes ?? ""} />
      </div>

      <div className="border-border space-y-3 border-t pt-3.5">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {t("components.tools.costSectionTitle", "Costo (opcional)")}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="costAmount">{t("components.tools.costAmountLabel", "Monto")}</Label>
            <Input
              id="costAmount"
              name="costAmount"
              type="number"
              min={0}
              step="0.01"
              defaultValue={tool?.cost_amount ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="costCurrency">{t("components.tools.costCurrencyLabel", "Moneda")}</Label>
            <Select name="costCurrency" defaultValue={tool?.cost_currency || "ARS"}>
              <SelectTrigger id="costCurrency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">{t("components.finance.currencyArs", "Pesos (ARS)")}</SelectItem>
                <SelectItem value="USD">{t("components.finance.currencyUsd", "Dólares (USD)")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="costFrequency">{t("components.tools.costFrequencyLabel", "Frecuencia")}</Label>
            <Select name="costFrequency" defaultValue={tool?.cost_frequency ?? "mensual"}>
              <SelectTrigger id="costFrequency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensual">{t("components.tools.costFrequencyMonthly", "Mensual")}</SelectItem>
                <SelectItem value="anual">{t("components.tools.costFrequencyYearly", "Anual")}</SelectItem>
                <SelectItem value="unico">{t("components.tools.costFrequencyOnce", "Pago único")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nextRenewalDate">{t("components.tools.nextRenewalLabel", "Próximo vencimiento")}</Label>
            <Input
              id="nextRenewalDate"
              name="nextRenewalDate"
              type="date"
              defaultValue={tool?.next_renewal_date ?? ""}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export function NewToolDialog() {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createToolAction(formData);
      if (res.ok) {
        toast.success(t("components.tools.toolSaved", "Herramienta guardada"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> {t("components.tools.newTool", "Nueva herramienta")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.tools.newToolTitle", "Nueva herramienta")}</DialogTitle>
            <DialogDescription>
              {t(
                "components.tools.newToolDesc",
                "La contraseña se guarda cifrada — solo vos y los editores a los que se la compartas pueden verla."
              )}
            </DialogDescription>
          </DialogHeader>
          <ToolFormFields passwordRequired={false} />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("common.save", "Guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditToolDialog({ tool }: { tool: AgencyToolWithAccess }) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateToolAction(tool.id, formData);
      if (res.ok) {
        toast.success(t("components.tools.toolUpdated", "Herramienta actualizada"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteToolAction(tool.id);
      if (res.ok) {
        toast.success(t("components.tools.toolDeleted", "Herramienta eliminada"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={t("components.tools.editToolAria", "Editar herramienta")}>
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.tools.editToolTitle", "Editar herramienta")}</DialogTitle>
          </DialogHeader>
          <ToolFormFields tool={tool} passwordRequired={false} />
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              <Trash2 /> {t("common.delete", "Eliminar")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("common.save", "Guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RevealPasswordButton({ toolId }: { toolId: string }) {
  const { t } = useLocale();
  const [password, setPassword] = React.useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (password) {
      setPassword(null);
      return;
    }
    startTransition(async () => {
      const res = await revealToolPasswordAction(toolId);
      if (res.ok) {
        setPassword(res.password);
      } else {
        toast.error(res.error);
      }
    });
  }

  async function copy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      toast.success(t("components.tools.copiedToClipboard", "Copiado al portapapeles"));
    } catch {
      toast.error(t("components.tools.copyFailed", "No se pudo copiar"));
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button size="icon" variant="ghost" onClick={toggle} disabled={isPending} aria-label={t("components.tools.revealAria", "Ver contraseña")}>
        {isPending ? <Loader2 className="animate-spin" /> : password ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </Button>
      {password && (
        <>
          <code className="bg-muted rounded px-2 py-1 text-xs">{password}</code>
          <Button size="icon" variant="ghost" onClick={copy} aria-label={t("components.tools.copyAria", "Copiar contraseña")}>
            <Copy className="size-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

function CopyEmailButton({ email }: { email: string }) {
  const { t } = useLocale();

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      toast.success(t("components.tools.copiedToClipboard", "Copiado al portapapeles"));
    } catch {
      toast.error(t("components.tools.copyFailed", "No se pudo copiar"));
    }
  }

  return (
    <Button size="icon" variant="ghost" onClick={copy} aria-label={t("components.tools.copyEmailAria", "Copiar mail")}>
      <Copy className="size-3.5" />
    </Button>
  );
}

const COST_FREQUENCY_LABEL: Record<string, [string, string]> = {
  mensual: ["components.tools.costFrequencyMonthly", "Mensual"],
  anual: ["components.tools.costFrequencyYearly", "Anual"],
  unico: ["components.tools.costFrequencyOnce", "Pago único"],
};

/** Catálogo de Herramientas de la agencia (/admin/herramientas). Solo admin. */
export function ToolList({ tools, editors }: { tools: AgencyToolWithAccess[]; editors: Profile[] }) {
  const { t } = useLocale();

  if (tools.length === 0) {
    return (
      <EmptyState icon={Wrench} title={t("components.tools.noTools", "Todavía no cargaste ninguna herramienta.")} />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("components.tools.tableName", "Nombre")}</TableHead>
          <TableHead>{t("components.tools.tablePurpose", "Para qué es")}</TableHead>
          <TableHead>{t("components.tools.tableEmail", "Mail")}</TableHead>
          <TableHead>{t("components.tools.tablePassword", "Contraseña")}</TableHead>
          <TableHead>{t("components.tools.tableCost", "Costo")}</TableHead>
          <TableHead>{t("components.tools.tableRenewal", "Vence")}</TableHead>
          <TableHead>{t("components.tools.tableSharedWith", "Compartida con")}</TableHead>
          <TableHead className="text-right">{t("components.tools.tableActions", "Acciones")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tools.map((tool) => {
          const urgency = getDateUrgency(tool.next_renewal_date);
          const badge = urgency ? URGENCY_BADGE[urgency] : null;
          return (
            <TableRow key={tool.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {tool.name}
                  {tool.url && (
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground text-xs underline"
                    >
                      {t("components.tools.openLink", "abrir")}
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{tool.purpose || "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {tool.account_email ? (
                  <div className="flex items-center gap-1">
                    <span className="truncate">{tool.account_email}</span>
                    <CopyEmailButton email={tool.account_email} />
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {tool.hasPassword ? (
                  <RevealPasswordButton toolId={tool.id} />
                ) : (
                  <span className="text-muted-foreground text-xs">{t("components.tools.noPassword", "Sin guardar")}</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {tool.cost_amount != null ? (
                  <div>
                    <div className="text-foreground font-medium">{formatCurrency(tool.cost_amount, tool.cost_currency)}</div>
                    {tool.cost_frequency && (
                      <div>{t(...COST_FREQUENCY_LABEL[tool.cost_frequency])}</div>
                    )}
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-xs">
                {tool.next_renewal_date ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">{formatDate(tool.next_renewal_date)}</span>
                    {badge && (
                      <Badge variant={badge.variant} className="w-fit">
                        {t(badge.key, badge.fallback)}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {tool.sharedWith.length === 0
                  ? t("components.tools.notShared", "Nadie todavía")
                  : tool.sharedWith.map((e) => e.name).join(", ")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  <ShareToolDialog toolId={tool.id} toolName={tool.name} editors={editors} sharedWith={tool.sharedWith} />
                  <EditToolDialog tool={tool} />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
