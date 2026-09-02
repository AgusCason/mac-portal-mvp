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
  "auth.login": "Inicio de sesión",
  "content.created": "Pieza de contenido creada",
  "content.status_changed": "Cambio de estado de contenido",
  "content.comment_added": "Comentario en una pieza",
  "web_asset.created": "Entregable web agregado",
  "web_asset.status_changed": "Cambio de estado de entregable web",
  "contract.created": "Contrato creado",
  "contract.signed": "Contrato firmado",
};

type TFunc = (path: string, fallback?: string) => string;

/** Slug (camelCase) de cada `action_type` dentro de `audit.actions.*` del diccionario. */
const AUDIT_ACTION_KEY: Record<string, string> = {
  "invoice.created": "invoiceCreated",
  "invoice.marked_paid": "invoiceMarkedPaid",
  "invoice.cancelled": "invoiceCancelled",
  "invoice.status_changed": "invoiceStatusChanged",
  "invoice.amount_changed": "invoiceAmountChanged",
  "invoice.payment_reported": "invoicePaymentReported",
  "payment_method.updated": "paymentMethodUpdated",
  "vault.credential_created": "vaultCredentialCreated",
  "vault.credential_updated": "vaultCredentialUpdated",
  "vault.credential_revealed": "vaultCredentialRevealed",
  "vault.credential_deleted": "vaultCredentialDeleted",
  "security.blocked": "securityBlocked",
  "security.alert": "securityAlert",
  "auth.login": "authLogin",
  "content.created": "contentCreated",
  "content.status_changed": "contentStatusChanged",
  "content.comment_added": "contentCommentAdded",
  "web_asset.created": "webAssetCreated",
  "web_asset.status_changed": "webAssetStatusChanged",
  "contract.created": "contractCreated",
  "contract.signed": "contractSigned",
};

/** Versión traducible de AUDIT_ACTION_LABELS — usar esta en componentes nuevos. */
export function getAuditActionLabel(actionType: string, t?: TFunc): string {
  const fallback = AUDIT_ACTION_LABELS[actionType] ?? actionType;
  const slug = AUDIT_ACTION_KEY[actionType];
  return slug && t ? t(`audit.actions.${slug}`, fallback) : fallback;
}
