import { requireRole } from "@/lib/auth";
import { getContentItems } from "@/lib/queries/content";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { ContentCalendarView } from "@/components/content/content-calendar-view";
import { getT } from "@/lib/i18n/dictionary";

export default async function ClientCalendarioPage() {
  const profile = await requireRole(["client"]);
  const t = getT(profile.language);
  const clientId = await getPrimaryClientId(profile.id);
  const items = clientId ? await getContentItems(clientId) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("pages.clientCalendario.title", "Tu calendario editorial")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("pages.clientCalendario.description", "Previsualizá, aprobá con un clic o pedí cambios con feedback puntual.")}
        </p>
      </div>
      <ContentCalendarView items={items} role="client" />
    </div>
  );
}
