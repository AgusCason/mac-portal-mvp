import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { requireAdmin } from "@/lib/auth";
import { getRecentActivity } from "@/lib/queries/activity";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Management > Actividad — bitácora completa del workspace (versión de
 * página completa del panel deslizante `ActivityPanel`).
 */
export default async function AdminActividadPage() {
  const profile = await requireAdmin();
  const t = getT(profile.language);
  const events = await getRecentActivity(100);

  const EVENT_META: Record<string, string> = {
    content_created: t("pages.actividad.contentCreated", "Nueva pieza"),
    content_status_changed: t("pages.actividad.contentStatusChanged", "Cambio de estado"),
    report_published: t("pages.actividad.reportPublished", "Reporte publicado"),
    contract_signed: t("pages.actividad.contractSigned", "Contrato firmado"),
    invoice_paid: t("pages.actividad.invoicePaid", "Pago registrado"),
    client_created: t("pages.actividad.clientCreated", "Cliente nuevo"),
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("nav.management.actividad", "Actividad")}</h1>
        <p className="text-muted-foreground text-sm">Bitácora completa de lo que pasó en el workspace.</p>
      </div>

      <div className="flex flex-col gap-2">
        {events.length === 0 && (
          <p className="text-muted-foreground rounded-xl border border-dashed py-8 text-center text-sm">
            Todavía no hay actividad registrada.
          </p>
        )}
        {events.map((event) => (
          <div key={event.id} className="border-border flex items-start justify-between gap-3 rounded-xl border px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {EVENT_META[event.event_type] ?? event.event_type}
                </Badge>
                {event.client_name && <span className="text-muted-foreground text-xs">{event.client_name}</span>}
              </div>
              <p className="mt-1.5 text-sm">{event.summary}</p>
            </div>
            <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
