import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContactWithClient } from "@/lib/queries/contacts";

export function ContactFormFields({
  contact,
  clients,
}: {
  contact?: ContactWithClient;
  clients: { id: string; name: string }[];
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required defaultValue={contact?.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="roleTitle">Cargo</Label>
          <Input id="roleTitle" name="roleTitle" defaultValue={contact?.role_title ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags (separados por coma)</Label>
          <Input
            id="tags"
            name="tags"
            placeholder="Cliente clave, Exportador..."
            defaultValue={contact?.tags?.join(", ") ?? ""}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="clientId">Cuenta (opcional)</Label>
        <Select name="clientId" defaultValue={contact?.client_id ?? "none"}>
          <SelectTrigger id="clientId" className="w-full">
            <SelectValue placeholder="Sin cuenta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin cuenta</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Input id="notes" name="notes" defaultValue={contact?.notes ?? ""} />
      </div>
    </>
  );
}
