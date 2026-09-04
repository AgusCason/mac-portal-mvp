"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Copy, Link2 } from "lucide-react";

import { createUtmLinkAction } from "@/app/actions/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Analytics > UTM Builder — arma la URL con parámetros UTM (equivalente al
 * generador de MB Suite) y guarda cada campaña armada en el historial de
 * abajo de la página.
 */
export function UtmBuilderForm({ clients }: { clients: { id: string; name: string }[] }) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [clientId, setClientId] = React.useState("none");
  const [generatedUrl, setGeneratedUrl] = React.useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    formData.set("clientId", clientId === "none" ? "" : clientId);
    startTransition(async () => {
      const res = await createUtmLinkAction(formData);
      if (res.ok) {
        setGeneratedUrl(res.generatedUrl);
        toast.success(t("components.analytics.campaignBuiltToast", "Campaña UTM armada y guardada en el historial."));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  async function copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("components.analytics.linkCopied", "Link copiado"));
    } catch {
      toast.error(t("components.analytics.copyErrorManual", "No se pudo copiar — copialo manualmente"));
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="icon-chip">
          <Link2 className="size-4" strokeWidth={1.75} />
        </div>
        <CardTitle>{t("components.analytics.buildCampaignTitle", "Armar campaña")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="baseUrl">{t("components.analytics.baseUrlLabel", "URL base")}</Label>
              <Input
                id="baseUrl"
                name="baseUrl"
                placeholder="https://tu-cliente.com/landing"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("components.analytics.accountOptionalLabel", "Cuenta (opcional)")}</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("components.analytics.noAccountPlaceholder", "Sin cuenta asociada")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("components.analytics.noAccountPlaceholder", "Sin cuenta asociada")}</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="utmSource">utm_source</Label>
              <Input id="utmSource" name="utmSource" placeholder="instagram" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="utmMedium">utm_medium</Label>
              <Input id="utmMedium" name="utmMedium" placeholder="social" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="utmCampaign">utm_campaign</Label>
              <Input id="utmCampaign" name="utmCampaign" placeholder="lanzamiento-agosto" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="utmTerm">utm_term {t("components.analytics.optionalSuffix", "(opcional)")}</Label>
              <Input id="utmTerm" name="utmTerm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="utmContent">utm_content {t("components.analytics.optionalSuffix", "(opcional)")}</Label>
              <Input id="utmContent" name="utmContent" />
            </div>
          </div>

          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? t("components.analytics.building", "Armando...") : t("components.analytics.generateLink", "Generar link")}
          </Button>
        </form>

        {generatedUrl && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-sm">
            <p className="min-w-0 flex-1 truncate font-mono text-xs">{generatedUrl}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => copyToClipboard(generatedUrl)}>
              <Copy className="size-3.5" /> {t("components.analytics.copyButton", "Copiar")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
