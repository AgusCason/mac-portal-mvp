"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  UserPlus,
  Phone,
  Mail,
  GripVertical,
  Loader2,
  Pencil,
  Trash2,
  CircleDot,
  PhoneCall,
  BadgeCheck,
  FileText,
  Trophy,
  XCircle,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";

import type { CrmLead, CrmLeadStage } from "@/types/database";
import {
  createLeadAction,
  updateLeadAction,
  updateLeadStageAction,
  deleteLeadAction,
} from "@/app/actions/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn, formatCurrency } from "@/lib/utils";
import { PHONE_INPUT_PATTERN } from "@/lib/validation";

// Tinte del icon-chip de cada columna, mismo mapeo que ya usa el board de
// contenido (content-board.tsx) — el color vive en el ícono, no en un fondo
// sólido de badge.
const STAGE_ICON_TINT: Record<string, string> = {
  secondary: "",
  info: "!border-info/30 !bg-info/10 !text-info",
  warning: "!border-warning/30 !bg-warning/10 !text-warning",
  destructive: "!border-destructive/30 !bg-destructive/10 !text-destructive",
  success: "!border-success/30 !bg-success/10 !text-success",
};

const STAGE_ORDER: CrmLeadStage[] = [
  "nuevo",
  "contactado",
  "calificado",
  "propuesta",
  "ganado",
  "perdido",
];

const STAGE_META: Record<
  CrmLeadStage,
  {
    labelKey: string;
    fallback: string;
    icon: typeof CircleDot;
    variant: React.ComponentProps<typeof Badge>["variant"];
  }
> = {
  nuevo: { labelKey: "components.crm.stageNuevo", fallback: "Nuevo", icon: CircleDot, variant: "secondary" },
  contactado: { labelKey: "components.crm.stageContactado", fallback: "Contactado", icon: PhoneCall, variant: "info" },
  calificado: { labelKey: "components.crm.stageCalificado", fallback: "Calificado", icon: BadgeCheck, variant: "info" },
  propuesta: { labelKey: "components.crm.stagePropuesta", fallback: "Propuesta", icon: FileText, variant: "warning" },
  ganado: { labelKey: "components.crm.stageGanado", fallback: "Ganado", icon: Trophy, variant: "success" },
  perdido: { labelKey: "components.crm.stagePerdido", fallback: "Perdido", icon: XCircle, variant: "destructive" },
};

function stageLabel(stage: CrmLeadStage, t: (path: string, fallback?: string) => string) {
  const meta = STAGE_META[stage];
  return t(meta.labelKey, meta.fallback);
}

function LeadFormFields({ lead }: { lead?: CrmLead }) {
  const { t } = useLocale();
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("components.crm.nameLabel", "Nombre / empresa")}</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={lead?.name}
          placeholder={t("components.crm.namePlaceholder", "Ej: Café Aurora")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contactName">{t("components.crm.contactLabel", "Contacto")}</Label>
          <Input id="contactName" name="contactName" defaultValue={lead?.contact_name ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="source">{t("components.crm.sourceLabel", "Origen")}</Label>
          <Input
            id="source"
            name="source"
            placeholder={t("components.crm.sourcePlaceholder", "Ej: Instagram, referido...")}
            defaultValue={lead?.source ?? ""}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contactEmail">{t("components.crm.emailLabel", "Email")}</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={lead?.contact_email ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactPhone">{t("components.crm.phoneLabel", "Teléfono")}</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            inputMode="tel"
            pattern={PHONE_INPUT_PATTERN}
            title={t("components.crm.phoneInvalidTitle", "Solo números, espacios, +, - y paréntesis")}
            defaultValue={lead?.contact_phone ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="estimatedValue">{t("components.crm.estimatedValueLabel", "Valor estimado (ARS)")}</Label>
        <Input
          id="estimatedValue"
          name="estimatedValue"
          type="number"
          min={0}
          step="1"
          defaultValue={lead?.estimated_value ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">{t("components.crm.notesLabel", "Notas")}</Label>
        <Input id="notes" name="notes" defaultValue={lead?.notes ?? ""} />
      </div>
    </>
  );
}

function NewLeadDialog() {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createLeadAction(formData);
      if (res.ok) {
        toast.success(t("components.crm.leadAdded", "Prospecto agregado"));
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
          <UserPlus /> {t("components.crm.newLead", "Nuevo prospecto")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.crm.newLeadTitle", "Nuevo prospecto")}</DialogTitle>
            <DialogDescription>{t("components.crm.newLeadDesc", 'Arranca en la etapa "Nuevo" del pipeline.')}</DialogDescription>
          </DialogHeader>
          <LeadFormFields />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("common.add", "Agregar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditLeadDialog({ lead }: { lead: CrmLead }) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateLeadAction(lead.id, formData);
      if (res.ok) {
        toast.success(t("components.crm.leadUpdated", "Prospecto actualizado"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteLeadAction(lead.id);
      if (res.ok) {
        toast.success(t("components.crm.leadDeleted", "Prospecto eliminado"));
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
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground shrink-0"
          aria-label={t("components.crm.editLeadAria", "Editar prospecto")}
        >
          <Pencil className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.crm.editLeadTitle", "Editar prospecto")}</DialogTitle>
          </DialogHeader>
          <LeadFormFields lead={lead} />
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

function LeadCard({ lead }: { lead: CrmLead }) {
  const { t } = useLocale();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { stage: lead.stage },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn("glass-card gap-2 py-4", isDragging && "z-50 opacity-60 shadow-lg")}
    >
      <CardHeader className="px-4">
        <CardTitle className="flex items-start justify-between gap-2 text-sm font-medium">
          <span className="line-clamp-2">{lead.name}</span>
          <div className="flex shrink-0 items-center gap-2">
            <EditLeadDialog lead={lead} />
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
              aria-label={t("components.crm.dragAria", "Arrastrar para cambiar de etapa")}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 px-4">
        {lead.contact_name && (
          <p className="text-muted-foreground truncate text-xs">{lead.contact_name}</p>
        )}
        {lead.contact_email && (
          <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
            <Mail className="size-3 shrink-0" /> {lead.contact_email}
          </p>
        )}
        {lead.contact_phone && (
          <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
            <Phone className="size-3 shrink-0" /> {lead.contact_phone}
          </p>
        )}
        {lead.estimated_value != null && (
          <p className="text-foreground text-xs font-medium tabular-nums">
            {formatCurrency(lead.estimated_value)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function BoardColumn({ stage, leads }: { stage: CrmLeadStage; leads: CrmLead[] }) {
  const { t } = useLocale();
  const meta = STAGE_META[stage];
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = leads.reduce((sum, l) => sum + (l.estimated_value ?? 0), 0);

  return (
    <div className="min-w-0 lg:w-64 lg:shrink-0">
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className={cn("icon-chip !size-7 !rounded-md", STAGE_ICON_TINT[meta.variant as string])}>
          <meta.icon className="size-3.5" strokeWidth={1.75} />
        </div>
        <span className="text-sm font-medium">{stageLabel(stage, t)}</span>
        <span className="text-muted-foreground ml-auto tabular-nums text-xs">{leads.length}</span>
      </div>
      {total > 0 && (
        <p className="text-muted-foreground mb-2 px-1 text-xs tabular-nums">{formatCurrency(total)}</p>
      )}
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-16 space-y-2 rounded-lg transition-colors duration-150",
          isOver && "bg-accent/60 ring-1 ring-inset ring-border"
        )}
      >
        {leads.length === 0 && <p className="text-muted-foreground px-1 text-xs">{t("components.crm.noLeads", "Sin prospectos")}</p>}
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

/**
 * Pipeline comercial (Fase 3.2 — CRM liviano, equivalente a MB Suite). Solo
 * la ve el admin. Drag-and-drop libre entre las 6 etapas: a diferencia del
 * calendario editorial, acá no hay ninguna transición que requiera un paso
 * intermedio obligatorio, así que cualquier movimiento es válido.
 */
export function CrmBoard({ leads }: { leads: CrmLead[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const grouped = React.useMemo(() => {
    const map = new Map<CrmLeadStage, CrmLead[]>();
    for (const stage of STAGE_ORDER) map.set(stage, []);
    for (const lead of leads) map.get(lead.stage)?.push(lead);
    return map;
  }, [leads]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const targetStage = over.id as CrmLeadStage;
    const currentStage = active.data.current?.stage as CrmLeadStage | undefined;
    if (!currentStage || targetStage === currentStage) return;

    startTransition(async () => {
      const res = await updateLeadStageAction(active.id as string, targetStage);
      if (res.ok) {
        toast.success(`${t("common.movedTo", "Movido a")} "${stageLabel(targetStage, t)}"`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <NewLeadDialog />
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:overflow-x-auto lg:pb-2">
          {STAGE_ORDER.map((stage) => (
            <BoardColumn key={stage} stage={stage} leads={grouped.get(stage) ?? []} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
