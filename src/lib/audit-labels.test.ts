import { describe, it, expect } from "vitest";
import { AUDIT_ACTION_LABELS } from "./audit-labels";

/**
 * Lista de `action_type` que realmente emiten las funciones/triggers de
 * Postgres (log_audit(), ver supabase/migrations/0026_audit_log.sql y
 * 0027_security_hardening.sql). Si agregás un `log_audit('algo.nuevo', ...)`
 * en una migración nueva, sumalo acá TAMBIÉN — este test no lee SQL, solo
 * evita que la tabla de Auditoría muestre el action_type crudo (sin label
 * legible) para algo que ya sabemos que existe.
 */
const KNOWN_ACTION_TYPES = [
  "invoice.created",
  "invoice.marked_paid",
  "invoice.cancelled",
  "invoice.status_changed",
  "invoice.amount_changed",
  "invoice.payment_reported",
  "payment_method.updated",
  "vault.credential_created",
  "vault.credential_updated",
  "vault.credential_revealed",
  "vault.credential_deleted",
  "security.blocked",
  "security.alert",
  "auth.login",
  "content.created",
  "content.status_changed",
  "content.comment_added",
  "web_asset.created",
  "web_asset.status_changed",
  "contract.created",
  "contract.signed",
];

describe("AUDIT_ACTION_LABELS", () => {
  it("tiene un label legible para cada action_type conocido", () => {
    for (const type of KNOWN_ACTION_TYPES) {
      expect(AUDIT_ACTION_LABELS[type], `falta label para "${type}"`).toBeTypeOf("string");
      expect(AUDIT_ACTION_LABELS[type]?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
