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

type TFunc = (path: string, fallback?: string) => string;

/** Slug (camelCase) de cada método dentro de `billing.paymentMethods.*` del diccionario. */
const PAYMENT_METHOD_KEY: Record<string, string> = {
  mercadopago: "mercadopago",
  paypal: "paypal",
  transferencia: "transferencia",
  payoneer: "payoneer",
  crypto: "crypto",
  otro: "otro",
};

/** Versión traducible de PAYMENT_METHOD_LABELS — usar en componentes cliente (charts, badges). */
export function getPaymentMethodLabel(method: string, t?: TFunc): string {
  const fallback = PAYMENT_METHOD_LABELS[method] ?? method;
  const slug = PAYMENT_METHOD_KEY[method];
  return slug && t ? t(`billing.paymentMethods.${slug}`, fallback) : fallback;
}

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
