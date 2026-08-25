"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";

import type { ContentItemWithClient } from "@/lib/queries/content";
import { STATUS_META } from "@/components/dashboard/content-status-badge";
import { STATUS_COLUMN_META } from "@/components/social-media/planner-board";
import { CATEGORY_META } from "@/lib/content-category-meta";
import { cn, formatTime } from "@/lib/utils";

const WEEKDAYS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Vista "Calendario" del Planner — grilla mensual con mini-tarjetas de post
 * por día, estilo MB Suite. `month` referencia el mes a mostrar (día 1);
 * `items` ya viene filtrado a ese mes desde PlannerView.
 */
export function PlannerCalendar({
  month,
  items,
}: {
  month: Date;
  items: ContentItemWithClient[];
}) {
  const today = React.useMemo(() => new Date(), []);

  const byDay = React.useMemo(() => {
    const map = new Map<number, ContentItemWithClient[]>();
    for (const item of items) {
      if (!item.scheduled_at) continue;
      const date = new Date(item.scheduled_at);
      if (date.getFullYear() !== month.getFullYear() || date.getMonth() !== month.getMonth()) continue;
      const day = date.getDate();
      const list = map.get(day) ?? [];
      list.push(item);
      map.set(day, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
    }
    return map;
  }, [items, month]);

  const cells = React.useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const list: Array<{ day: number | null; date: Date | null }> = [];
    for (let i = 0; i < firstWeekday; i++) list.push({ day: null, date: null });
    for (let d = 1; d <= daysInMonth; d++) list.push({ day: d, date: new Date(year, monthIndex, d) });
    return list;
  }, [month]);

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="text-muted-foreground border-r border-border px-2 py-2 text-center text-xs font-semibold last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const dayItems = cell.day ? (byDay.get(cell.day) ?? []) : [];
          const isToday = cell.date && isSameDay(cell.date, today);
          return (
            <div
              key={i}
              className={cn(
                "border-border min-h-28 space-y-1 border-r border-b p-1.5 last:border-r-0",
                (i + 1) % 7 === 0 && "border-r-0"
              )}
            >
              {cell.day && (
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full text-xs",
                    isToday ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  )}
                >
                  {cell.day}
                </span>
              )}
              <div className="space-y-1">
                {dayItems.map((item) => {
                  const meta = STATUS_META[item.status];
                  const category = item.category ? CATEGORY_META[item.category] : null;
                  return (
                    <div
                      key={item.id}
                      className="border-border bg-card flex items-start gap-1.5 rounded-md border p-1"
                    >
                      <div className="bg-muted relative size-6 shrink-0 overflow-hidden rounded">
                        {item.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.thumbnail_url} alt="" className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <ImageOff className="text-muted-foreground size-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] leading-tight font-medium">{item.title}</p>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px]">
                          {item.scheduled_at && (
                            <span className="text-muted-foreground tabular-nums">
                              {formatTime(item.scheduled_at)}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <span className={cn("size-1.5 rounded-full", STATUS_COLUMN_META[item.status].dot)} />
                            {meta.label}
                          </span>
                        </div>
                        {category && (
                          <span
                            className={cn(
                              "mt-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px]",
                              category.pill
                            )}
                          >
                            {category.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
