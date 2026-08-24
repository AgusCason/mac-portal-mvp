import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { requireAdmin } from "@/lib/auth";
import { getRecentActivity } from "@/lib/queries/activity";
import { Badge } from "@/components/ui/badge";

const EVENT_META: Record<string, string> = {
  content_created: "Nueva pieza",
  content_status_changed: "Cambio de estado",
  report_published: "Reporte publicado",
  contract_signed: "Contrato firmado",
  invoice_paid: "Pago registrado",
  client_created: "Cliente nuevo",
};

/**
 * Management > Actividad — bitácora completa del workspace (versión de
 * página completa del panel deslizante `ActivityPanel`).
 */
export default async function AdminActividadPage() {
  await requireAdmin();
  const events = await getRecentActivity(100);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Actividad</h1>
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
