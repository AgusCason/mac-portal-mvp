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
