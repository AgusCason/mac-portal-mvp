"use client";

import * as React from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Send } from "lucide-react";

import { askPortalAssistantAction } from "@/app/actions/portal-assistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Botón flotante del Portal de Clientes — abajo a la derecha, con la
 * estrella lima de la marca (el mismo ícono del favicon). Abre un asistente
 * de IA que SOLO responde preguntas sobre cómo usar el portal (dónde está
 * cada cosa, cómo aprobar una pieza, cómo pagar una factura, etc.) — no ve
 * datos reales del cliente ni de la agencia (ver lib/ai/portal-assistant.ts).
 * Historial en memoria del componente nomás, se pierde al cerrar/recargar —
 * es un asistente de uso, no un canal de soporte con registro.
 */
export function PortalHelpAssistant() {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<DisplayMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isPending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isPending) return;

    const history = messages.slice(-12);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setDraft("");

    startTransition(async () => {
      const res = await askPortalAssistantAction(history, text);
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      } else {
        toast.error(res.error);
        setMessages((prev) => prev.slice(0, -1));
        setDraft(text);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("components.portalAssistant.openButton", "Asistente del portal")}
        className={cn(
          "fixed right-4 bottom-4 z-40 size-14 rounded-full p-0 shadow-lg sm:right-6 sm:bottom-6",
          "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        <Sparkles className="size-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col p-0">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="text-primary size-5" />
              {t("components.portalAssistant.title", "Asistente del portal")}
            </SheetTitle>
            <SheetDescription>
              {t(
                "components.portalAssistant.disclaimer",
                "Te ayudo a usar el portal — no veo tus datos ni los de otros clientes. Para lo demás, escribile a la agencia por Chat."
              )}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4">
            <div className="flex flex-col gap-3 py-4">
              {messages.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  {t(
                    "components.portalAssistant.emptyState",
                    "Preguntame cosas como \"¿cómo apruebo un video?\" o \"¿dónde pago mi factura?\"."
                  )}
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {isPending && (
                <div className="flex items-start">
                  <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                    <Loader2 className="size-3.5 animate-spin" />
                    {t("components.portalAssistant.thinking", "Pensando…")}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("components.portalAssistant.inputPlaceholder", "Escribí tu pregunta…")}
              autoComplete="off"
              disabled={isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isPending || draft.trim() === ""}
              aria-label={t("components.chat.sendButton", "Enviar")}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
