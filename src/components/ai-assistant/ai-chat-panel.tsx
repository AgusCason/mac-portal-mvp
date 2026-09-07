"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Send, Loader2, Sparkles, User } from "lucide-react";

import { sendAiMessageAction } from "@/app/actions/ai-assistant";
import { MAX_AGENT } from "@/lib/ai/agents";
import type { AiMessage } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProposalCard } from "@/components/ai-assistant/proposal-card";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

const DATE_LOCALE: Record<string, string> = { es: "es-AR", en: "en-US" };

/**
 * Chat del asistente IA (solo Admin). Cada mensaje del asistente que trae
 * una propuesta pendiente (`pending_action`) se renderiza con su
 * <ProposalCard /> — el único gesto que puede terminar mutando datos, y
 * siempre detrás de un clic humano explícito.
 */
export function AiChatPanel({
  conversationId,
  messages,
}: {
  conversationId: string | null;
  messages: AiMessage[];
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingText, setPendingText] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pendingText]);

  function handleSubmit(formData: FormData) {
    const message = String(formData.get("message") ?? "").trim();
    if (!message) return;

    setPendingText(message);
    startTransition(async () => {
      const res = await sendAiMessageAction(conversationId, message);
      formRef.current?.reset();
      setPendingText(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.conversationId !== conversationId) {
        router.push(`/admin/asistente?conv=${res.conversationId}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex h-[36rem] flex-col overflow-hidden rounded-xl border border-border">
      {/* <ScrollAreaPrimitive.Root> de Radix fija position:relative por
          INLINE style, así que una clase "absolute" en la propia ScrollArea
          nunca gana esa pulseada (sigue relative). El wrapper PLANO de acá
          abajo sí puede ser absolute inset-0 — con top/bottom en 0 su alto
          queda definido explícitamente, y la ScrollArea adentro (h-full) y
          su viewport interno (height:100%) resuelven en cascada. Sin esto,
          un `flex-1` solo en la ScrollArea no alcanza (min-height:auto de
          flexbox) y el historial completo se renderiza sin límite de alto,
          quedando cortado por el overflow-hidden del contenedor de afuera
          SIN scroll para volver a ver lo que se fue para arriba. Ver
          new-client-dialog.tsx para el diagnóstico completo. */}
      <div className="relative min-h-0 flex-1">
      <div className="absolute inset-0">
      <ScrollArea className="h-full p-4">
        <div className="flex flex-col gap-4">
          {messages.length === 0 && !pendingText && (
            <p className="text-muted-foreground text-sm">
              {t("components.aiAssistant.emptyStatePrefix", "Preguntale a")} {MAX_AGENT.name}{" "}
              {t(
                "components.aiAssistant.emptyStateSuffix",
                "por el estado de un cliente, pedile que revise errores comunes, o que te proponga un arreglo — vos siempre confirmás antes de que se aplique."
              )}
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
              <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                {m.role === "user" ? <User className="size-3" /> : <Sparkles className="size-3" />}
                {m.role === "user" ? t("components.aiAssistant.you", "Vos") : MAX_AGENT.name} ·{" "}
                {new Date(m.created_at).toLocaleTimeString(DATE_LOCALE[locale] ?? "es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}
              >
                {m.content}
              </div>
              {m.pending_action && <ProposalCard messageId={m.id} proposal={m.pending_action} />}
            </div>
          ))}
          {pendingText && (
            <div className="flex flex-col items-end gap-2">
              <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                {pendingText}
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Loader2 className="size-3 animate-spin" /> {MAX_AGENT.name}{" "}
                {t("components.aiAssistant.thinkingSuffix", "está pensando…")}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      </div>
      </div>
      <form
        ref={formRef}
        action={handleSubmit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          name="message"
          placeholder={t("components.aiAssistant.inputPlaceholder", "Escribile al asistente…")}
          required
          autoComplete="off"
          disabled={isPending}
        />
        <Button type="submit" size="icon" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </div>
  );
}
