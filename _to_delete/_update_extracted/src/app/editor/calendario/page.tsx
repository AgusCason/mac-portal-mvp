import { requireRole } from "@/lib/auth";
import { getContentItems, getSelectableClients } from "@/lib/queries/content";
import { ContentBoard } from "@/components/content/content-board";
import { ContentList } from "@/components/content/content-list";
import { NewContentDialog } from "@/components/content/new-content-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista">Lista por fecha límite</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>
        <TabsContent value="lista" className="mt-4">
          <ContentList items={items} role="editor" />
        </TabsContent>
        <TabsContent value="kanban" className="mt-4">
          <ContentBoard items={items} role="editor" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
