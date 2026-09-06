import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { requireAdmin } from "@/lib/auth";
import { getRecentActivity } from "@/lib/queries/activity";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, History } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getT, resolveLocale } from "@/lib/i18n/dictionary";

const DATE_FNS_LOCALE = { es, en: enUS } as const;

/**
 * Management > Actividad — bitácora completa del workspace (versión de
 * página completa del panel deslizante `ActivityPanel`).
 */
export default async function AdminActividadPage() {
  const profile = await requireAdmin();
  const t = getT(profile.language);
  const dateFnsLocale = DATE_FNS_LOCALE[resolveLocale(profile.language)];
  const events = await getRecentActivity(100);

  const EVENT_META: Record<string, string> = {
    content_created: t("pages.actividad.contentCreated", "Nueva pieza"),
    content_status_changed: t("pages.actividad.contentStatusChanged", "Cambio de estado"),
    report_published: t("pages.actividad.reportPublished", "Reporte publicado"),
    contract_signed: t("pages.actividad.contractSigned", "Contrato firmado"),
    invoice_paid: t("pages.actividad.invoicePaid", "Pago registrado"),
    client_created: t("pages.actividad.clientCreated", "Cliente nuevo"),
  };

  const eventCounts = new Map<string, number>();
  for (const event of events) {
    eventCounts.set(event.event_type, (eventCounts.get(event.event_type) ?? 0) + 1);
  }
  const eventTypesByCount = Array.from(eventCounts.entries()).sort((a, b) => b[1] - a[1]);
  const maxEventCount = Math.max(1, ...eventTypesByCount.map(([, count]) => count));

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.proyectos.actividad", "Actividad")}
        description={t("pages.actividad.description", "Bitácora completa de lo que pasó en el workspace.")}
      />

      {eventTypesByCount.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="icon-chip">
              <BarChart3 className="size-4" strokeWidth={1.75} />
            </div>
            <CardTitle>{t("pages.actividad.byTypeTitle", "Eventos por tipo")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {eventTypesByCount.map(([type, count]) => {
              const widthPct = Math.max(4, Math.round((count / maxEventCount) * 100));
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 truncate text-[11.5px] font-semibold">
                    {EVENT_META[type] ?? type}
                  </span>
                  <div className="bg-accent/60 h-2 flex-1 overflow-hidden rounded-full">
                    <span className="bg-primary/80 block h-full rounded-full" style={{ width: `${widthPct}%` }} />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {events.length === 0 && (
          <EmptyState icon={History} title={t("pages.actividad.emptyState", "Todavía no hay actividad registrada.")} />
        )}
        {events.map((event) => (
          <div key={event.id} className="glass-card flex items-start justify-between gap-3 rounded-xl px-4 py-3">
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
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: dateFnsLocale })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
