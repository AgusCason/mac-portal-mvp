"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, Landmark } from "lucide-react";

import { updatePaymentMethodAction } from "@/app/actions/payment-methods";
import { PAYMENT_METHOD_KIND_LABELS } from "@/lib/billing-labels";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import type { PaymentMethodConfig, PaymentMethodKind } from "@/types/database";

const LINK_KINDS: PaymentMethodKind[] = ["paypal", "mercadopago", "payoneer"];

function LinkMethodCard({ config }: { config: PaymentMethodConfig }) {
  const { t } = useLocale();
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(config.enabled);
  const [isPending, startTransition] = React.useTransition();

  const LINK_HELP: Record<string, string> = {
    paypal: t("billing.paypalLinkHelp", "Pegá acá tu link de PayPal.me o el que generes con PayPal Payment Links."),
    mercadopago: t(
      "billing.mercadopagoLinkHelp",
      'Pegá acá el link que genera Mercado Pago con Checkout Pro / "Cobrar".'
    ),
    payoneer: t(
      "billing.payoneerLinkHelp",
      'Pegá acá el link que genera Payoneer al pedir un pago ("Request a Payment").'
    ),
  };

  function handleSubmit(formData: FormData) {
    formData.set("enabled", enabled ? "on" : "off");
    startTransition(async () => {
      const res = await updatePaymentMethodAction(config.kind, formData);
      if (res.ok) {
        toast.success(`${PAYMENT_METHOD_KIND_LABELS[config.kind]} ${t("billing.updatedSuffix", "actualizado")}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-1.5 text-base">
            <Link2 className="size-4" /> {PAYMENT_METHOD_KIND_LABELS[config.kind]}
          </CardTitle>
          <CardDescription>{LINK_HELP[config.kind]}</CardDescription>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} disabled={isPending} />
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor={`link-${config.kind}`}>{t("billing.paymentLinkLabel", "Link de pago")}</Label>
            <Input
              id={`link-${config.kind}`}
              name="paymentLink"
              type="url"
              placeholder="https://…"
              defaultValue={config.payment_link ?? ""}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending}>
              {t("common.save", "Guardar")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TransferAcctCard({ config }: { config: PaymentMethodConfig }) {
  const { t } = useLocale();
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(config.enabled);
  const [isPending, startTransition] = React.useTransition();
  const isArs = config.kind === "transferencia_ars";

  function handleSubmit(formData: FormData) {
    formData.set("enabled", enabled ? "on" : "off");
    startTransition(async () => {
      const res = await updatePaymentMethodAction(config.kind, formData);
      if (res.ok) {
        toast.success(`${PAYMENT_METHOD_KIND_LABELS[config.kind]} ${t("billing.updatedSuffix", "actualizado")}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-1.5 text-base">
            <Landmark className="size-4" /> {PAYMENT_METHOD_KIND_LABELS[config.kind]}
          </CardTitle>
          <CardDescription>
            {t("billing.transferDescPrefix", "Datos que va a ver el cliente para transferir")}{" "}
            {isArs ? t("billing.transferDescArs", "en pesos") : t("billing.transferDescUsd", "en dólares")}.
          </CardDescription>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} disabled={isPending} />
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor={`holder-${config.kind}`}>{t("billing.accountHolderLabel", "Titular de la cuenta")}</Label>
            <Input
              id={`holder-${config.kind}`}
              name="accountHolder"
              defaultValue={config.account_holder ?? ""}
            />
          </div>

          {isArs ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="cuit">{t("billing.cuitLabel", "CUIT/CUIL")}</Label>
                <Input id="cuit" name="cuit" defaultValue={config.cuit ?? ""} />
              </div>
              <div>
                <Label htmlFor="cbu">{t("billing.cbuLabel", "CBU")}</Label>
                <Input id="cbu" name="cbu" defaultValue={config.cbu ?? ""} />
              </div>
              <div>
                <Label htmlFor="alias">{t("billing.aliasLabel", "Alias")}</Label>
                <Input id="alias" name="alias" defaultValue={config.alias ?? ""} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="bankName">{t("billing.bankNameLabel", "Banco")}</Label>
                <Input id="bankName" name="bankName" defaultValue={config.bank_name ?? ""} />
              </div>
              <div>
                <Label htmlFor="accountNumber">{t("billing.accountNumberLabel", "Número de cuenta")}</Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  defaultValue={config.account_number ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="routingNumber">{t("billing.routingNumberLabel", "Routing number")}</Label>
                <Input
                  id="routingNumber"
                  name="routingNumber"
                  defaultValue={config.routing_number ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="swiftBic">{t("billing.swiftBicLabel", "SWIFT/BIC")}</Label>
                <Input id="swiftBic" name="swiftBic" defaultValue={config.swift_bic ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="bankAddress">{t("billing.bankAddressLabel", "Dirección del banco")}</Label>
                <Input
                  id="bankAddress"
                  name="bankAddress"
                  defaultValue={config.bank_address ?? ""}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor={`notes-${config.kind}`}>
              {t("billing.notesClientVisibleLabel", "Notas (opcional, las ve el cliente)")}
            </Label>
            <Textarea
              id={`notes-${config.kind}`}
              name="notes"
              rows={2}
              defaultValue={config.notes ?? ""}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending}>
              {t("common.save", "Guardar")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Configuración > Planes y facturación > Métodos de cobro — Nivel 1: cada
 * método es un link generado a mano en el dashboard de la plataforma
 * (PayPal/Mercado Pago/Payoneer) o datos de transferencia fijos para toda la
 * agencia (no por cliente). Lo que esté "Activo" acá es lo que el cliente ve
 * como opción para pagar en /client/facturas.
 */
export function PaymentMethodsPanel({
  methods,
}: {
  methods: Record<PaymentMethodKind, PaymentMethodConfig | undefined>;
}) {
  const order: PaymentMethodKind[] = [
    "paypal",
    "mercadopago",
    "payoneer",
    "transferencia_ars",
    "transferencia_usd",
  ];

  return (
    <div className="space-y-4">
      {order.map((kind) => {
        const config = methods[kind];
        if (!config) return null;
        return LINK_KINDS.includes(kind) ? (
          <LinkMethodCard key={kind} config={config} />
        ) : (
          <TransferAcctCard key={kind} config={config} />
        );
      })}
    </div>
  );
}
