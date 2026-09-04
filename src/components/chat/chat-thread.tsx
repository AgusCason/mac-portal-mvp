"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle } from "lucide-react";

import { sendChatMessageAction } from "@/app/actions/chat";
import type { ChatMessageWithSender } from "@/lib/queries/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

const DATE_LOCALE: Record<string, string> = { es: "es-AR", en: "en-US" };

/** Iniciales cortas para el avatar circular del remitente (máx. 2 letras). */
function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "?";
}

/**
 * Bandeja de chat tipo CRM (Módulo E). `outbound` = agencia -> cliente,
 * `inbound` = cliente -> agencia (o mensaje real recibido por WhatsApp
 * Cloud API vía el webhook en /api/webhooks/whatsapp).
 */
export function ChatThread({
  clientId,
  messages,
  currentProfileId,
  defaultMessage,
}: {
  clientId: string;
  messages: ChatMessageWithSender[];
  currentProfileId: string;
  /** Prefillea el composer — ej: al venir de "Pedir Ajustes" en el calendario. */
  defaultMessage?: string;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = React.useState(defaultMessage ?? "");
  const formRef = React.useRef<HTMLFormElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await sendChatMessageAction(formData);
      if (res.ok) {
        formRef.current?.reset();
        setDraft("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="border-border bg-card flex h-[32rem] flex-col overflow-hidden rounded-xl border">
      <ScrollArea className="flex-1 p-4">
        <div className="flex h-full flex-col gap-4">
          {messages.length === 0 && (
            <EmptyState
              icon={MessageCircle}
              title={t("components.chat.noMessages", "Todavía no hay mensajes en este hilo.")}
              hint={t("components.chat.noMessagesHint", "Escribí el primer mensaje abajo para arrancar la conversación.")}
              className="my-auto"
            />
          )}
          {messages.map((m) => {
            const mine = m.sender_profile_id === currentProfileId;
            const senderLabel =
              m.sender_name ??
              (m.direction === "inbound"
                ? t("components.chat.senderClient", "Cliente")
                : t("components.chat.senderAgency", "Agencia"));
            return (
              <div
                key={m.id}
                className={cn("flex items-end gap-2", mine ? "flex-row-reverse" : "flex-row")}
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
                    mine ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}
                  aria-hidden
                >
                  {initials(senderLabel)}
                </div>
                <div className={cn("flex max-w-[75%] flex-col", mine ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    {m.body}
                  </div>
                  <span className="text-muted-foreground mt-1 px-0.5 text-[11px]">
                    {senderLabel}{" "}
                    ·{" "}
                    {new Date(m.created_at).toLocaleTimeString(DATE_LOCALE[locale] ?? "es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <form
        ref={formRef}
        action={handleSubmit}
        className="border-border bg-muted/30 flex items-center gap-2 border-t p-3"
      >
        <input type="hidden" name="clientId" value={clientId} />
        <Input
          name="body"
          placeholder={t("components.chat.messagePlaceholder", "Escribí un mensaje...")}
          required
          autoComplete="off"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="bg-background"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isPending}
          aria-label={t("components.chat.sendButton", "Enviar")}
        >
          {isPending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </div>
  );
}
