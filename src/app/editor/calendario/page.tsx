import { requireRole } from "@/lib/auth";
import { getContentItems, getSelectableClients } from "@/lib/queries/content";
import { ContentCalendarView } from "@/components/content/content-calendar-view";
import { NewContentDialog } from "@/components/content/new-content-dialog";
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

      <ContentCalendarView items={items} role="editor" />
    </div>
  );
}
