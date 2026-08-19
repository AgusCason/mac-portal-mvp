import { requireRole } from "@/lib/auth";
import { getContentItems, getSelectableClients } from "@/lib/queries/content";
import { ContentBoard } from "@/components/content/content-board";
import { NewContentDialog } from "@/components/content/new-content-dialog";

export default async function EditorCalendarioPage() {
  await requireRole(["editor"]);
  // RLS limita `getContentItems`/`getSelectableClients` a los clientes asignados.
  const [items, clients] = await Promise.all([getContentItems(), getSelectableClients()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calendario editorial</h1>
          <p className="text-muted-foreground text-sm">
            Piezas de tus clientes asignados.
          </p>
        </div>
        <NewContentDialog clients={clients} />
      </div>
      <ContentBoard items={items} role="editor" />
    </div>
  );
}
