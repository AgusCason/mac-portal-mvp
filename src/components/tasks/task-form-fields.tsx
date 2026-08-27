import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/locale-context";
import type { TaskWithRelations } from "@/lib/queries/tasks";

/** Campos compartidos entre "Nueva tarea" y "Editar tarea". */
export function TaskFormFields({
  task,
  clients,
  staff,
}: {
  task?: TaskWithRelations;
  clients: { id: string; name: string }[];
  staff: { id: string; full_name: string }[];
}) {
  const { t } = useLocale();
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="title">{t("components.tasks.titleLabel", "Título")}</Label>
        <Input id="title" name="title" required defaultValue={task?.title} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">{t("components.tasks.descriptionLabel", "Descripción")}</Label>
        <Input id="description" name="description" defaultValue={task?.description ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="priority">{t("components.tasks.priorityLabel", "Prioridad")}</Label>
          <Select name="priority" defaultValue={task?.priority ?? "media"}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baja">{t("components.tasks.priorityBaja", "Baja")}</SelectItem>
              <SelectItem value="media">{t("components.tasks.priorityMedia", "Media")}</SelectItem>
              <SelectItem value="alta">{t("components.tasks.priorityAlta", "Alta")}</SelectItem>
              <SelectItem value="urgente">{t("components.tasks.priorityUrgente", "Urgente")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">{t("components.tasks.dueDateLabel", "Vencimiento")}</Label>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={task?.due_date ?? ""} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="clientId">{t("components.tasks.accountLabel", "Cuenta (opcional)")}</Label>
          <Select name="clientId" defaultValue={task?.client_id ?? "none"}>
            <SelectTrigger id="clientId">
              <SelectValue placeholder={t("components.tasks.accountPlaceholder", "Privada")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("components.tasks.noAccountOption", "Privada (sin cuenta)")}</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="assignedTo">{t("components.tasks.assigneeLabel", "Responsable")}</Label>
          <Select name="assignedTo" defaultValue={task?.assigned_to ?? "none"}>
            <SelectTrigger id="assignedTo">
              <SelectValue placeholder={t("components.tasks.assigneePlaceholder", "Sin asignar")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("components.tasks.unassignedOption", "Sin asignar")}</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
}
