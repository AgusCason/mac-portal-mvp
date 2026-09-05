import { requireRole } from "@/lib/auth";
import { getContentItems, getSelectableClients } from "@/lib/queries/content";
import { ContentCalendarView } from "@/components/content/content-calendar-view";
import { NewContentDialog } from "@/components/content/new-content-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

export default async function EditorCalendarioPage() {
  const profile = await requireRole(["editor"]);
  const t = getT(profile.language);
  // RLS limita `getContentItems`/`getSelectableClients` a los clientes asignados.
  const [items, clients] = await Promise.all([getContentItems(), getSelectableClients()]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.calendario.title", "Calendario editorial")}
        description="Piezas de tus clientes asignados."
        actions={<NewContentDialog clients={clients} />}
      />

      <ContentCalendarView items={items} role="editor" />
    </div>
  );
}
