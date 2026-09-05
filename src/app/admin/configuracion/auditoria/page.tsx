import { requireRole } from "@/lib/auth";
import { getAuditLog, type AuditLogEntryWithRelations } from "@/lib/queries/audit-log";
import { getAllProfilesLite } from "@/lib/queries/team";
import { AuditLogTable } from "@/components/config/audit-log-table";
import { AuditLogFiltersBar, type AuditLogUserOption } from "@/components/config/audit-log-filters";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { buildCsv, type CsvColumn } from "@/lib/export-csv";
import { AUDIT_ACTION_LABELS, getAuditActionLabel } from "@/lib/audit-labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";

const AUDIT_CSV_COLUMNS: CsvColumn<AuditLogEntryWithRelations>[] = [
  { header: "Fecha", value: (e) => formatDate(e.created_at) },
  { header: "Acción", value: (e) => AUDIT_ACTION_LABELS[e.action_type] ?? e.action_type },
  { header: "Usuario", value: (e) => e.actor_name },
  { header: "Cliente", value: (e) => e.client_name },
  { header: "Detalle", value: (e) => e.summary },
];

/**
 * Configuración > Auditoría — quién marcó facturas como pagadas, editó
 * métodos de cobro, o tocó una credencial de la Bóveda. Se llena sola vía
 * triggers/funciones (0026_audit_log.sql); esta pantalla es de solo lectura.
 * Filtros (fecha + tipo de acción + usuario) viven en la URL, mismo patrón
 * que TaskFilters en /admin/tareas. El filtro por usuario (?usuario=) deja
 * ver de un vistazo toda la actividad de auditoría de una persona puntual
 * (admin, editor o cliente) — útil para reconstruir qué pasó ante cualquier
 * problema, sin tener que revisar entrada por entrada.
 */
export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; accion?: string; usuario?: string }>;
}) {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const { desde, hasta, accion, usuario } = await searchParams;

  const [entries, profiles] = await Promise.all([
    getAuditLog({
      dateFrom: desde || undefined,
      dateTo: hasta || undefined,
      actionType: accion || undefined,
      actorId: usuario || undefined,
    }),
    getAllProfilesLite(),
  ]);

  const userOptions: AuditLogUserOption[] = profiles.map((p) => ({
    id: p.id,
    label: p.full_name || p.email,
  }));
  const auditCsv = buildCsv(AUDIT_CSV_COLUMNS, entries);

  const actionCounts = new Map<string, number>();
  for (const entry of entries) {
    actionCounts.set(entry.action_type, (actionCounts.get(entry.action_type) ?? 0) + 1);
  }
  const topActions = Array.from(actionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxActionCount = Math.max(1, ...topActions.map(([, count]) => count));

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("audit.pageTitle", "Auditoría")}
        description={t(
          "audit.pageDescription",
          "Registro de acciones financieras y sensibles — quién marcó qué como pagado, quién editó los métodos de cobro, quién tocó una credencial de la Bóveda."
        )}
        actions={<ExportCsvButton filename="auditoria.csv" csv={auditCsv} disabled={entries.length === 0} />}
      />

      {topActions.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="icon-chip">
              <BarChart3 className="size-4" strokeWidth={1.75} />
            </div>
            <CardTitle>{t("audit.byActionTitle", "Acciones más frecuentes")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {topActions.map(([actionType, count]) => {
              const widthPct = Math.max(4, Math.round((count / maxActionCount) * 100));
              return (
                <div key={actionType} className="flex items-center gap-3">
                  <span className="w-52 shrink-0 truncate text-[11.5px] font-semibold">
                    {getAuditActionLabel(actionType, t)}
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

      <AuditLogFiltersBar users={userOptions} />
      <AuditLogTable entries={entries} />
    </div>
  );
}
