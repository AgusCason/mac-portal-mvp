import { requireRole } from "@/lib/auth";
import { getContentItems, getSelectableClients } from "@/lib/queries/content";
import { ContentCalendarView } from "@/components/content/content-calendar-view";
import { NewContentDialog } from "@/components/content/new-content-dialog";
import { ContentStatusChart } from "@/components/dashboard/content-status-chart";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";
import type { ContentStatus } from "@/types/database";

const CONTENT_STATUS_ORDER: ContentStatus[] = [
  "borrador",
  "en_edicion",
  "por_aprobar",
  "requiere_cambios",
  "aprobado",
  "programado",
  "publicado",
];

export default async function AdminCalendarioPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const [items, clients] = await Promise.all([getContentItems(), getSelectableClients()]);

  const contentByStatus = Object.fromEntries(
    CONTENT_STATUS_ORDER.map((s) => [s, items.filter((i) => i.status === s).length])
  ) as Record<ContentStatus, number>;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.calendario.title", "Calendario editorial")}
        description="Todas las piezas de todos los clientes, en su estado actual."
        actions={<NewContentDialog clients={clients} />}
      />

      {items.length > 0 && (
        <ContentStatusChart
          contentByStatus={contentByStatus}
          t={t}
          title={t("pages.calendario.byStatusTitle", "Piezas por estado")}
          description={t("pages.calendario.byStatusDesc", "Distribución de todo el contenido cargado, en cualquier fecha.")}
        />
      )}

      <ContentCalendarView items={items} role="admin" />
    </div>
  );
}
