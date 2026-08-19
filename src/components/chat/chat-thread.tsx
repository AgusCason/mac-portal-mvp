"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

import { sendChatMessageAction } from "@/app/actions/chat";
import type { ChatMessageWithSender } from "@/lib/queries/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/**
 * Bandeja de chat tipo CRM (Módulo E). `outbound` = agencia -> cliente,
 * `inbound` = cliente -> agencia (o mensaje real recibido por WhatsApp
 * Cloud API vía el webhook en /api/webhooks/whatsapp).
 */
export function ChatThread({
  clientId,
  messages,
  currentProfileId,
}: {
  clientId: string;
  messages: ChatMessageWithSender[];
  currentProfileId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-xl border border-border">
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Todavía no hay mensajes en este hilo.
            </p>
          )}
          {messages.map((m) => {
            const mine = m.sender_profile_id === currentProfileId;
            return (
              <div
                key={m.id}
                className={cn("flex flex-col", mine ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {m.body}
                </div>
                <span className="text-muted-foreground mt-1 text-[11px]">
                  {m.sender_name ?? (m.direction === "inbound" ? "Cliente" : "Agencia")} ·{" "}
                  {new Date(m.created_at).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <form
        ref={formRef}
        action={handleSubmit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input type="hidden" name="clientId" value={clientId} />
        <Input name="body" placeholder="Escribí un mensaje..." required autoComplete="off" />
        <Button type="submit" size="icon" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </div>
  );
}
