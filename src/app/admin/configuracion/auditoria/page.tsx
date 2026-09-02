import { requireRole } from "@/lib/auth";
import { getAuditLog } from "@/lib/queries/audit-log";
import { getAllProfilesLite } from "@/lib/queries/team";
import { AuditLogTable } from "@/components/config/audit-log-table";
import { AuditLogFiltersBar, type AuditLogUserOption } from "@/components/config/audit-log-filters";
import { getT } from "@/lib/i18n/dictionary";

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("audit.pageTitle", "Auditoría")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t(
            "audit.pageDescription",
            "Registro de acciones financieras y sensibles — quién marcó qué como pagado, quién editó los métodos de cobro, quién tocó una credencial de la Bóveda."
          )}
        </p>
      </div>

      <AuditLogFiltersBar users={userOptions} />
      <AuditLogTable entries={entries} />
    </div>
  );
}
