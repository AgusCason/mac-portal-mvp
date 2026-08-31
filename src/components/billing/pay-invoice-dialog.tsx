"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ExternalLink, Landmark, Loader2, CheckCircle2 } from "lucide-react";

import { reportInvoicePaymentAction } from "@/app/actions/billing";
import { PAYMENT_METHOD_KIND_LABELS } from "@/lib/billing-labels";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceWithRelations } from "@/lib/queries/billing";
import type { PaymentMethodConfig } from "@/types/database";

const LINK_KINDS = ["paypal", "mercadopago", "payoneer"] as const;

function CopyField({
  label,
  value,
  onCopy,
  t,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  t: (path: string, fallback?: string) => string;
}) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("billing.copied", "Copiado"));
      onCopy();
    } catch {
      toast.error(t("billing.copyError", "No se pudo copiar"));
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleCopy}
        aria-label={`${t("billing.copy", "Copiar")} ${label}`}
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  );
}

/**
 * Botón "Pagar" de una factura pendiente/atrasada (/client/facturas) —
 * Nivel 1: muestra los métodos que el admin dejó activos en Configuración >
 * Planes y facturación > Métodos de cobro. Los de link (PayPal/Mercado
 * Pago/Payoneer) redirigen afuera; la transferencia bancaria (según la
 * moneda de la factura) se muestra como datos para copiar. Nada de esto
 * concilia el pago solo — "Ya pagué/transferí" solo le avisa al admin
 * (`reportInvoicePaymentAction`) para que lo confirme a mano.
 */
export function PayInvoiceDialog({
  invoice,
  methods,
}: {
  invoice: InvoiceWithRelations;
  methods: PaymentMethodConfig[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [lastMethod, setLastMethod] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const linkMethods = methods.filter((m) => (LINK_KINDS as readonly string[]).includes(m.kind));
  const preferredTransferKind = invoice.currency === "ARS" ? "transferencia_ars" : "transferencia_usd";
  const transferMethod =
    methods.find((m) => m.kind === preferredTransferKind) ??
    methods.find((m) => m.kind === "transferencia_ars" || m.kind === "transferencia_usd");

  function handleReportPaid() {
    startTransition(async () => {
      const res = await reportInvoicePaymentAction(invoice.id, lastMethod ?? undefined);
      if (res.ok) {
        toast.success(t("billing.iPaidSuccess", "Listo, le avisamos al admin."));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const hasAnyMethod = linkMethods.length > 0 || Boolean(transferMethod);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{t("billing.payNow", "Pagar")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("billing.payDialogTitle", "Pagar factura")}</DialogTitle>
          <DialogDescription>
            {formatCurrency(invoice.amount, invoice.currency)} ·{" "}
            {t("billing.payDialogDescription", "Elegí cómo pagar — el pago se acredita afuera de la plataforma.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!hasAnyMethod && (
            <p className="text-muted-foreground text-sm">
              {t(
                "billing.noMethodsConfigured",
                "Todavía no hay métodos de cobro configurados — consultale al admin cómo pagar."
              )}
            </p>
          )}

          {linkMethods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {linkMethods.map((m) => (
                <Button
                  key={m.kind}
                  asChild
                  variant="outline"
                  onClick={() => setLastMethod(m.kind)}
                >
                  <a href={m.payment_link ?? "#"} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                    {PAYMENT_METHOD_KIND_LABELS[m.kind]}
                  </a>
                </Button>
              ))}
            </div>
          )}

          {transferMethod && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Landmark className="size-3.5" />
                {t("billing.bankTransfer", "Transferencia bancaria")}
              </p>
              <div className="space-y-1.5">
                {transferMethod.account_holder && (
                  <CopyField
                    label={t("billing.accountHolderLabel", "Titular de la cuenta")}
                    value={transferMethod.account_holder}
                    onCopy={() => setLastMethod(transferMethod.kind)}
                    t={t}
                  />
                )}
                {transferMethod.kind === "transferencia_ars" ? (
                  <>
                    {transferMethod.cbu && (
                      <CopyField
                        label={t("billing.cbuLabel", "CBU")}
                        value={transferMethod.cbu}
                        onCopy={() => setLastMethod(transferMethod.kind)}
                        t={t}
                      />
                    )}
                    {transferMethod.alias && (
                      <CopyField
                        label={t("billing.aliasLabel", "Alias")}
                        value={transferMethod.alias}
                        onCopy={() => setLastMethod(transferMethod.kind)}
                        t={t}
                      />
                    )}
                    {transferMethod.cuit && (
                      <CopyField
                        label={t("billing.cuitLabel", "CUIT/CUIL")}
                        value={transferMethod.cuit}
                        onCopy={() => setLastMethod(transferMethod.kind)}
                        t={t}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {transferMethod.bank_name && (
                      <CopyField
                        label={t("billing.bankNameLabel", "Banco")}
                        value={transferMethod.bank_name}
                        onCopy={() => setLastMethod(transferMethod.kind)}
                        t={t}
                      />
                    )}
                    {transferMethod.account_number && (
                      <CopyField
                        label={t("billing.accountNumberLabel", "Número de cuenta")}
                        value={transferMethod.account_number}
                        onCopy={() => setLastMethod(transferMethod.kind)}
                        t={t}
                      />
                    )}
                    {transferMethod.routing_number && (
                      <CopyField
                        label={t("billing.routingNumberLabel", "Routing number")}
                        value={transferMethod.routing_number}
                        onCopy={() => setLastMethod(transferMethod.kind)}
                        t={t}
                      />
                    )}
                    {transferMethod.swift_bic && (
                      <CopyField
                        label={t("billing.swiftBicLabel", "SWIFT/BIC")}
                        value={transferMethod.swift_bic}
                        onCopy={() => setLastMethod(transferMethod.kind)}
                        t={t}
                      />
                    )}
                  </>
                )}
                {transferMethod.notes && (
                  <p className="text-muted-foreground text-xs">{transferMethod.notes}</p>
                )}
              </div>
            </div>
          )}

          <Button className="w-full" variant="secondary" disabled={isPending} onClick={handleReportPaid}>
            {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            {t("billing.iPaid", "Ya pagué / transferí")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
