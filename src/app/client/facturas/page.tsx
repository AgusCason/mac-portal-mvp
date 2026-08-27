import { requireRole } from "@/lib/auth";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { getInvoices } from "@/lib/queries/billing";
import { getEnabledPaymentMethods } from "@/lib/queries/payment-methods";
import { ClientInvoiceList } from "@/components/billing/client-invoice-list";
import { getT } from "@/lib/i18n/dictionary";

/** Facturación del cliente — sus facturas (RLS-aware) y cómo pagarlas (Nivel 1). */
export default async function ClientFacturasPage() {
  const profile = await requireRole(["client"]);
  const t = getT(profile.language);
  const clientId = await getPrimaryClientId(profile.id);

  const [invoices, enabledMethods] = await Promise.all([
    clientId ? getInvoices(clientId) : Promise.resolve([]),
    getEnabledPaymentMethods(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("billing.clientPageTitle", "Facturación")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("billing.clientPageDescription", "Tus facturas y cómo pagarlas.")}
        </p>
      </div>

      {clientId ? (
        <ClientInvoiceList invoices={invoices} enabledMethods={enabledMethods} />
      ) : (
        <p className="text-muted-foreground text-sm">
          {t("pages.client.noClientLinked", "Tu cuenta todavía no está vinculada a ningún cliente.")}
        </p>
      )}
    </div>
  );
}
