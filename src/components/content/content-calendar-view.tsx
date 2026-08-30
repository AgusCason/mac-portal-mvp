"use client";

import * as React from "react";
import { Kanban, CalendarDays, List, ChevronLeft, ChevronRight } from "lucide-react";

import type { ContentItemWithClient } from "@/lib/queries/content";
import type { UserRole } from "@/types/database";
import { ContentBoard } from "@/components/content/content-board";
import { ContentList } from "@/components/content/content-list";
import { PlannerCalendar } from "@/components/social-media/planner-calendar";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

type ViewMode = "panel" | "calendario" | "listado";

const MONTH_FORMAT_LOCALE: Record<string, string> = { es: "es-AR", en: "en-US" };

/**
 * Switch de formato (Panel / Calendario / Listado) para el calendario
 * editorial — hoy usado en /client/calendario, reutilizando los mismos
 * componentes de contenido que ya existen para cada formato (ContentBoard,
 * PlannerCalendar, ContentList) en vez de duplicar la lógica de cada vista.
 * El formato Calendario es una grilla de solo lectura (aprobar/pedir cambios
 * sigue viviendo en Panel); Listado ya sabe ocultar columnas admin-only
 * cuando `role === "client"`.
 */
export function ContentCalendarView({
  items,
  role,
}: {
  items: ContentItemWithClient[];
  role: UserRole;
}) {
  const { t, locale } = useLocale();
  const [view, setView] = React.useState<ViewMode>("panel");
  const [month, setMonth] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthLabel = React.useMemo(
    () =>
      new Intl.DateTimeFormat(MONTH_FORMAT_LOCALE[locale] ?? "es-AR", { month: "long", year: "numeric" }).format(
        month
      ),
    [month, locale]
  );

  const VIEW_OPTIONS: { value: ViewMode; label: string; icon: typeof Kanban }[] = [
    { value: "panel", label: t("components.content.viewPanel", "Panel"), icon: Kanban },
    { value: "calendario", label: t("components.content.viewCalendario", "Calendario"), icon: CalendarDays },
    { value: "listado", label: t("components.content.viewListado", "Listado"), icon: List },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {view === "calendario" ? (
          <div className="border-border flex items-center gap-1 rounded-lg border px-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="w-28 text-center text-xs font-medium capitalize">{monthLabel}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : (
          <div />
        )}

        <div
          role="group"
          aria-label={t("components.content.viewSwitchAriaLabel", "Formato de vista")}
          className="border-border ml-auto flex items-center gap-0.5 rounded-lg border p-0.5"
        >
          {VIEW_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant={view === opt.value ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => setView(opt.value)}
            >
              <opt.icon className="size-4" />
              <span className="hidden sm:inline">{opt.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {view === "panel" && <ContentBoard items={items} role={role} />}
      {view === "calendario" && (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[560px]">
            <PlannerCalendar month={month} items={items} />
          </div>
        </div>
      )}
      {view === "listado" && <ContentList items={items} role={role} />}
    </div>
  );
}
