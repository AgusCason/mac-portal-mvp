import { requireRole } from "@/lib/auth";
import { getAuditLog } from "@/lib/queries/audit-log";
import { AuditLogTable } from "@/components/config/audit-log-table";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Configuración > Auditoría — quién marcó facturas como pagadas, editó
 * métodos de cobro, o tocó una credencial de la Bóveda. Se llena sola vía
 * triggers/funciones (0026_audit_log.sql); esta pantalla es de solo lectura.
 */
export default async function AuditoriaPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const entries = await getAuditLog();

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

      <AuditLogTable entries={entries} />
    </div>
  );
}
