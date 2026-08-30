import { requireRole } from "@/lib/auth";
import { getContentItems, getSelectableClients } from "@/lib/queries/content";
import { ContentCalendarView } from "@/components/content/content-calendar-view";
import { NewContentDialog } from "@/components/content/new-content-dialog";
import { getT } from "@/lib/i18n/dictionary";

export default async function AdminCalendarioPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const [items, clients] = await Promise.all([getContentItems(), getSelectableClients()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("pages.calendario.title", "Calendario editorial")}</h1>
          <p className="text-muted-foreground text-sm">
            Todas las piezas de todos los clientes, en su estado actual.
          </p>
        </div>
        <NewContentDialog clients={clients} />
      </div>
      <ContentCalendarView items={items} role="admin" />
    </div>
  );
}
