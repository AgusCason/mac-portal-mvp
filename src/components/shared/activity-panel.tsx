"use client";

import * as React from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

import type { ActivityEventWithClient } from "@/lib/queries/activity";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

const EVENT_META: Record<string, string> = {
  content_created: "Nueva pieza",
  content_status_changed: "Cambio de estado",
  report_published: "Reporte publicado",
  contract_signed: "Contrato firmado",
  invoice_paid: "Pago registrado",
  client_created: "Cliente nuevo",
};

/**
 * Panel deslizante "Actividad" — bitácora del workspace, equivalente al
 * ícono de "nota con rayo" del navbar de MB Suite. Se alimenta de
 * `activity_events` (ver migración 0009), poblada por triggers de negocio.
 */
export function ActivityPanel({ events }: { events: ActivityEventWithClient[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Actividad">
          <ActivityIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Actividad</SheetTitle>
          <SheetDescription>Lo último que pasó en el workspace.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-6rem)] px-4">
          <div className="flex flex-col gap-3 pb-6">
            {events.length === 0 && (
              <p className="text-muted-foreground text-sm">Todavía no hay actividad registrada.</p>
            )}
            {events.map((event) => (
              <div key={event.id} className="rounded-lg border border-border px-3 py-2.5 text-sm">
                <div className="text-muted-foreground flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide">
                  <span>{EVENT_META[event.event_type] ?? event.event_type}</span>
                  <span>
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
                <p className="mt-1">{event.summary}</p>
                {event.client_name && (
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">{event.client_name}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
