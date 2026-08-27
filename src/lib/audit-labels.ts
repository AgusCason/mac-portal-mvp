/**
 * Labels legibles de `AuditLogEntry.action_type` (Configuración > Auditoría).
 * Vive fuera de `lib/queries/audit-log.ts` (server-only) por el mismo motivo
 * que PAYMENT_METHOD_LABELS en billing-labels.ts: el componente cliente que
 * arma la tabla también los necesita.
 */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "invoice.created": "Factura creada",
  "invoice.marked_paid": "Factura marcada como pagada",
  "invoice.cancelled": "Factura cancelada",
  "invoice.status_changed": "Cambio de estado de factura",
  "invoice.amount_changed": "Monto de factura editado",
  "invoice.payment_reported": "Cliente avisó un pago",
  "payment_method.updated": "Método de cobro actualizado",
  "vault.credential_created": "Credencial creada en la Bóveda",
  "vault.credential_updated": "Credencial editada en la Bóveda",
  "vault.credential_revealed": "Secreto revelado en la Bóveda",
  "vault.credential_deleted": "Credencial eliminada de la Bóveda",
  "security.blocked": "Bloqueo automático temporal",
  "security.alert": "Alerta de monitoreo de seguridad",
};
