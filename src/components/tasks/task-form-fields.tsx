import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required defaultValue={task?.title} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" defaultValue={task?.description ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="priority">Prioridad</Label>
          <Select name="priority" defaultValue={task?.priority ?? "media"}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baja">Baja</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Vencimiento</Label>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={task?.due_date ?? ""} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="clientId">Cuenta (opcional)</Label>
          <Select name="clientId" defaultValue={task?.client_id ?? "none"}>
            <SelectTrigger id="clientId">
              <SelectValue placeholder="Privada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Privada (sin cuenta)</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="assignedTo">Responsable</Label>
          <Select name="assignedTo" defaultValue={task?.assigned_to ?? "none"}>
            <SelectTrigger id="assignedTo">
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin asignar</SelectItem>
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
