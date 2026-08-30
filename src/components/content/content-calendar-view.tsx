"use client";

import * as React from "react";
import { Kanban, CalendarDays, List, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";

import type { ContentItemWithClient } from "@/lib/queries/content";
import type { UserRole } from "@/types/database";
import { ContentBoard } from "@/components/content/content-board";
import { ContentList } from "@/components/content/content-list";
import { PlannerCalendar } from "@/components/social-media/planner-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NETWORK_META } from "@/lib/network-meta";
import { useLocale } from "@/lib/i18n/locale-context";

type ViewMode = "panel" | "calendario" | "listado";

const MONTH_FORMAT_LOCALE: Record<string, string> = { es: "es-AR", en: "en-US" };

/**
 * Switch de formato (Panel / Calendario / Listado) para el calendario
 * editorial — usado en /admin, /editor y /client (calendario), reutilizando
 * los mismos componentes de contenido que ya existen para cada formato
 * (ContentBoard, PlannerCalendar, ContentList) en vez de duplicar la lógica
 * de cada vista. Búsqueda + filtro de cliente/red se resuelven acá y se
 * aplican por igual a las tres vistas (Panel además tiene su propio filtro
 * interno, que queda redundante pero no rompe nada una vez que ya filtraste
 * acá). El formato Calendario es una grilla de solo lectura — aprobar/pedir
 * cambios sigue viviendo en Panel; Listado ya sabe ocultar columnas
 * admin-only cuando `role === "client"`. El scroll horizontal de la grilla
 * mensual (cuando el ancho no alcanza) queda contenido a su propio recuadro,
 * nunca a la página entera.
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
  const [search, setSearch] = React.useState("");
  const [clientFilter, setClientFilter] = React.useState("all");
  const [networkFilter, setNetworkFilter] = React.useState("all");

  const clientOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) map.set(item.client_id, item.client_name);
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [items]);

  const networkOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const item of items) set.add(item.network);
    return Array.from(set) as (typeof items)[number]["network"][];
  }, [items]);

  const filteredItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        (q === "" || item.title.toLowerCase().includes(q)) &&
        (clientFilter === "all" || item.client_id === clientFilter) &&
        (networkFilter === "all" || item.network === networkFilter)
    );
  }, [items, search, clientFilter, networkFilter]);

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

  const hasFilters = clientOptions.length > 1 || networkOptions.length > 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("components.content.searchPlaceholder", "Buscar por título...")}
            className="pl-8"
          />
        </div>

        {view === "calendario" && (
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
        )}

        {hasFilters && (
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="icon">
                <SlidersHorizontal className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 space-y-3">
              {clientOptions.length > 1 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">{t("components.content.clientLabel", "Cliente")}</p>
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("components.content.allClients", "Todos los clientes")}</SelectItem>
                      {clientOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {networkOptions.length > 1 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">{t("components.content.networkLabel", "Red")}</p>
                  <Select value={networkFilter} onValueChange={setNetworkFilter}>
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("components.content.allNetworks", "Todas las redes")}</SelectItem>
                      {networkOptions.map((n) => (
                        <SelectItem key={n} value={n}>
                          {NETWORK_META[n].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </PopoverContent>
          </Popover>
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

      {filteredItems.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed py-8 text-center text-sm">
          {t("components.content.noMatchFilter", "No hay piezas que coincidan con el filtro.")}
        </p>
      ) : (
        <>
          {view === "panel" && <ContentBoard items={filteredItems} role={role} />}
          {view === "calendario" && (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[560px]">
                <PlannerCalendar month={month} items={filteredItems} />
              </div>
            </div>
          )}
          {view === "listado" && <ContentList items={filteredItems} role={role} />}
        </>
      )}
    </div>
  );
}
