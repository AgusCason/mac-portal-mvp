import { describe, it, expect } from "vitest";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_KIND_LABELS } from "./billing-labels";

// `method` de billing_invoices (ver createInvoiceSchema en app/actions/billing.ts).
const KNOWN_PAYMENT_METHODS = ["mercadopago", "paypal", "transferencia", "payoneer", "crypto", "otro"];

// `payment_method_kind` (ver supabase/migrations/0025_payment_methods.sql).
const KNOWN_PAYMENT_METHOD_KINDS = [
  "paypal",
  "mercadopago",
  "payoneer",
  "transferencia_ars",
  "transferencia_usd",
];

describe("billing labels", () => {
  it("PAYMENT_METHOD_LABELS cubre todos los métodos de factura conocidos", () => {
    for (const method of KNOWN_PAYMENT_METHODS) {
      expect(PAYMENT_METHOD_LABELS[method], `falta label para method "${method}"`).toBeTypeOf("string");
    }
  });

  it("PAYMENT_METHOD_KIND_LABELS cubre todos los payment_method_kind conocidos", () => {
    for (const kind of KNOWN_PAYMENT_METHOD_KINDS) {
      expect(PAYMENT_METHOD_KIND_LABELS[kind], `falta label para kind "${kind}"`).toBeTypeOf("string");
    }
  });
});
