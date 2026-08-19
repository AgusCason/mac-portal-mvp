import { requireRole } from "@/lib/auth";
import { getContentItems, getSelectableClients } from "@/lib/queries/content";
import { ContentBoard } from "@/components/content/content-board";
import { NewContentDialog } from "@/components/content/new-content-dialog";

export default async function AdminCalendarioPage() {
  await requireRole(["admin"]);
  const [items, clients] = await Promise.all([getContentItems(), getSelectableClients()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calendario editorial</h1>
          <p className="text-muted-foreground text-sm">
            Todas las piezas de todos los clientes, en su estado actual.
          </p>
        </div>
        <NewContentDialog clients={clients} />
      </div>
      <ContentBoard items={items} role="admin" />
    </div>
  );
}
