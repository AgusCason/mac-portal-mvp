/**
 * Etiquetas compartidas del módulo de facturación. Vive fuera de
 * `lib/queries/billing.ts` (marcado `server-only`) a propósito: tanto
 * componentes de servidor (agregaciones) como de cliente (charts, badges)
 * necesitan estas constantes, y un archivo `server-only` no puede
 * importarse desde el cliente ni siquiera para un valor plano.
 */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mercadopago: "Mercado Pago",
  paypal: "PayPal",
  transferencia: "Transferencia",
  payoneer: "Payoneer",
  crypto: "Cripto",
  otro: "Otro",
};

/**
 * Labels de `PaymentMethodKind` (config de cobro de la agencia — ver
 * payment_methods / getPaymentMethods) — distinto de PAYMENT_METHOD_LABELS
 * de arriba, que es el método elegido factura por factura.
 */
export const PAYMENT_METHOD_KIND_LABELS: Record<string, string> = {
  paypal: "PayPal",
  mercadopago: "Mercado Pago",
  payoneer: "Payoneer",
  transferencia_ars: "Transferencia (Argentina)",
  transferencia_usd: "Transferencia internacional (USD)",
};
