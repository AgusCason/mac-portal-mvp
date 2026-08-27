import { requireRole } from "@/lib/auth";
import { getContentItems, getSelectableClients } from "@/lib/queries/content";
import { ContentBoard } from "@/components/content/content-board";
import { ContentList } from "@/components/content/content-list";
import { NewContentDialog } from "@/components/content/new-content-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getT } from "@/lib/i18n/dictionary";

export default async function EditorCalendarioPage() {
  const profile = await requireRole(["editor"]);
  const t = getT(profile.language);
  // RLS limita `getContentItems`/`getSelectableClients` a los clientes asignados.
  const [items, clients] = await Promise.all([getContentItems(), getSelectableClients()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("pages.calendario.title", "Calendario editorial")}</h1>
          <p className="text-muted-foreground text-sm">
            Piezas de tus clientes asignados.
          </p>
        </div>
        <NewContentDialog clients={clients} />
      </div>

      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista">{t("pages.editorCalendario.tabList", "Lista por fecha límite")}</TabsTrigger>
          <TabsTrigger value="kanban">{t("pages.editorCalendario.tabKanban", "Kanban")}</TabsTrigger>
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
