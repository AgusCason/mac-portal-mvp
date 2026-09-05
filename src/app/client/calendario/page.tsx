import { requireRole } from "@/lib/auth";
import { getContentItems } from "@/lib/queries/content";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { ContentCalendarView } from "@/components/content/content-calendar-view";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

export default async function ClientCalendarioPage({
  searchParams,
}: {
  // Deep-link "Revisar" del dashboard (/client/calendario?item=<id>) — lleva
  // directo a la pieza puntual que el cliente tiene pendiente de aprobar.
  searchParams: Promise<{ item?: string }>;
}) {
  const profile = await requireRole(["client"]);
  const t = getT(profile.language);
  const clientId = await getPrimaryClientId(profile.id);
  const items = clientId ? await getContentItems(clientId) : [];
  const { item } = await searchParams;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.clientCalendario.title", "Tu calendario editorial")}
        description={t("pages.clientCalendario.description", "Previsualizá, aprobá con un clic o pedí cambios con feedback puntual.")}
      />
      <ContentCalendarView items={items} role="client" focusItemId={item} />
    </div>
  );
}
