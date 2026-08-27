"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { FileSignature, Loader2, ExternalLink, CheckCircle2, Clock } from "lucide-react";

import type { ContractWithClient } from "@/lib/queries/contracts";
import { signContractAction } from "@/app/actions/contracts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatDate } from "@/lib/utils";

export function ContractList({
  contracts,
  role,
}: {
  contracts: ContractWithClient[];
  role: "admin" | "client";
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function sign(id: string) {
    startTransition(async () => {
      const res = await signContractAction(id);
      if (res.ok) {
        toast.success(t("components.contracts.contractSigned", "Contrato firmado"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (contracts.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{t("components.contracts.noContracts", "Todavía no hay contratos cargados.")}</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {contracts.map((contract) => (
        <Card key={contract.id}>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileSignature className="text-muted-foreground size-4" strokeWidth={1.75} />
                <p className="text-sm font-medium">{contract.title}</p>
              </div>
              <Badge variant={contract.status === "firmado" ? "success" : "warning"}>
                {contract.status === "firmado" ? <CheckCircle2 /> : <Clock />}
                {contract.status === "firmado" ? t("components.contracts.signed", "Firmado") : t("components.contracts.pending", "Pendiente")}
              </Badge>
            </div>
            {role === "admin" && (
              <p className="text-muted-foreground truncate text-xs">{contract.client_name}</p>
            )}
            <p className="text-muted-foreground text-xs">
              {contract.status === "firmado" && contract.signed_at
                ? `${t("components.contracts.signedOnPrefix", "Firmado el")} ${formatDate(contract.signed_at)}`
                : `${t("components.contracts.uploadedOnPrefix", "Cargado el")} ${formatDate(contract.created_at)}`}
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline" className="flex-1">
                <a href={contract.file_url} target="_blank" rel="noreferrer">
                  <ExternalLink /> {t("components.contracts.viewDocument", "Ver documento")}
                </a>
              </Button>
              {role === "client" && contract.status === "pendiente" && (
                <Button size="sm" onClick={() => sign(contract.id)} disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                  {t("components.contracts.sign", "Firmar")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
