"use client";

import * as React from "react";
import { use } from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

import type { ActivityEventWithClient } from "@/lib/queries/activity";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

const EVENT_META_KEY: Record<string, { key: string; fallback: string }> = {
  content_created: { key: "pages.actividad.contentCreated", fallback: "Nueva pieza" },
  content_status_changed: { key: "pages.actividad.contentStatusChanged", fallback: "Cambio de estado" },
  report_published: { key: "pages.actividad.reportPublished", fallback: "Reporte publicado" },
  contract_signed: { key: "pages.actividad.contractSigned", fallback: "Contrato firmado" },
  invoice_paid: { key: "pages.actividad.invoicePaid", fallback: "Pago registrado" },
  client_created: { key: "pages.actividad.clientCreated", fallback: "Cliente nuevo" },
};

/**
 * Panel deslizante "Actividad" — bitácora del workspace, equivalente al
 * ícono de "nota con rayo" del navbar de MB Suite. Se alimenta de
 * `activity_events` (ver migración 0009), poblada por triggers de negocio.
 */
export function ActivityPanel({ eventsPromise }: { eventsPromise: Promise<ActivityEventWithClient[]> }) {
  // `use()` desenvuelve la promesa acá adentro, dentro del <Suspense> que
  // pone AppShell — así esta consulta no bloquea el resto del shell/página
  // mientras está en vuelo (ver app-shell.tsx).
  const events = use(eventsPromise);
  const { t, locale } = useLocale();
  const dateLocale = locale === "en" ? enUS : es;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("components.shared.activity", "Actividad")}>
          <ActivityIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{t("components.shared.activity", "Actividad")}</SheetTitle>
          <SheetDescription>{t("components.shared.activityDesc", "Lo último que pasó en el workspace.")}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-6rem)] px-6">
          <div className="flex flex-col gap-3 pb-6">
            {events.length === 0 && (
              <p className="text-muted-foreground text-sm">{t("components.shared.noActivity", "Todavía no hay actividad registrada.")}</p>
            )}
            {events.map((event) => {
              const meta = EVENT_META_KEY[event.event_type];
              return (
                <div key={event.id} className="rounded-lg border border-border px-3 py-2.5 text-sm">
                  <div className="text-muted-foreground flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide">
                    <span>{meta ? t(meta.key, meta.fallback) : event.event_type}</span>
                    <span>
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: dateLocale })}
                    </span>
                  </div>
                  <p className="mt-1">{event.summary}</p>
                  {event.client_name && (
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">{event.client_name}</p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
