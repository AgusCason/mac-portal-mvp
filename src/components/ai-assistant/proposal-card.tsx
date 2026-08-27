"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Loader2, ShieldAlert } from "lucide-react";

import { confirmAiActionAction, rejectAiActionAction } from "@/app/actions/ai-assistant";
import type { AiProposedAction } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Tarjeta de confirmación humana — el corazón del modelo de seguridad del
 * asistente. Claude NUNCA aplica un cambio por sí solo: como mucho llega
 * hasta acá, con un resumen y un target_id concretos, y queda literalmente
 * congelado hasta que el admin hace clic en "Confirmar" o "Rechazar".
 */
export function ProposalCard({
  messageId,
  proposal,
}: {
  messageId: string;
  proposal: AiProposedAction;
}) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [resolved, setResolved] = React.useState<"confirmed" | "rejected" | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const res = await confirmAiActionAction(messageId);
      if (res.ok) {
        toast.success(res.summary);
        setResolved("confirmed");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      const res = await rejectAiActionAction(messageId);
      if (res.ok) {
        setResolved("rejected");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card className="border-warning/40 bg-warning/5 max-w-md gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldAlert className="text-warning size-4" />
          {t("components.aiAssistant.proposalTitle", "Propuesta de cambio — requiere tu confirmación")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        <p className="text-sm">{proposal.summary}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">{proposal.action_type}</Badge>
          <Badge variant="outline">{proposal.target_table}</Badge>
        </div>

        {resolved === "confirmed" && (
          <Badge variant="success" className="w-fit">
            {t("components.aiAssistant.proposalConfirmed", "Confirmado y aplicado")}
          </Badge>
        )}
        {resolved === "rejected" && (
          <Badge variant="secondary" className="w-fit">
            {t("components.aiAssistant.proposalRejected", "Rechazado — no se aplicó ningún cambio")}
          </Badge>
        )}

        {resolved === null && (
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleConfirm} disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : <Check />}
              {t("components.aiAssistant.confirmButton", "Confirmar")}
            </Button>
            <Button size="sm" variant="outline" onClick={handleReject} disabled={isPending}>
              <X />
              {t("components.aiAssistant.rejectButton", "Rechazar")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
