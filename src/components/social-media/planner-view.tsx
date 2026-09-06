"use client";

import * as React from "react";
import { ImageOff, Kanban, CalendarDays, List, Search, SearchX, Send, LayoutGrid, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
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
import { PlannerBoard } from "@/components/social-media/planner-board";
import { PlannerCalendar } from "@/components/social-media/planner-calendar";
import { PlannerList } from "@/components/social-media/planner-list";
import { NewContentDialog } from "@/components/content/new-content-dialog";
import { MediaLibraryView } from "@/components/media-library/media-library-view";
import { CATEGORY_ORDER, getCategoryLabel } from "@/lib/content-category-meta";
import { NETWORK_META } from "@/lib/network-meta";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatDate, cn } from "@/lib/utils";
import type { ContentItemWithClient } from "@/lib/queries/content";
import type { MediaAssetWithRelations, MediaFolderWithCount } from "@/lib/queries/media-library";

type PlannerViewMode = "tablero" | "calendario" | "lista";

const MONTH_FORMAT_LOCALE: Record<string, string> = { es: "es-AR", en: "en-US" };

function PlannerToolbar({
  view,
  onViewChange,
  search,
  onSearchChange,
  month,
  onMonthChange,
  clientFilter,
  onClientFilterChange,
  networkFilter,
  onNetworkFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  clients,
}: {
  view: PlannerViewMode;
  onViewChange: (v: PlannerViewMode) => void;
  search: string;
  onSearchChange: (v: string) => void;
  month: Date;
  onMonthChange: (d: Date) => void;
  clientFilter: string;
  onClientFilterChange: (v: string) => void;
  networkFilter: string;
  onNetworkFilterChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  clients: { id: string; name: string }[];
}) {
  const { t, locale } = useLocale();

  const VIEW_OPTIONS: { value: PlannerViewMode; label: string; icon: typeof Kanban }[] = [
    { value: "tablero", label: t("components.planner.viewTablero", "Tablero"), icon: Kanban },
    { value: "calendario", label: t("components.planner.viewCalendario", "Calendario"), icon: CalendarDays },
    { value: "lista", label: t("components.planner.viewLista", "Lista"), icon: List },
  ];

  const label = React.useMemo(
    () =>
      new Intl.DateTimeFormat(MONTH_FORMAT_LOCALE[locale] ?? "es-AR", { month: "long", year: "numeric" }).format(
        month
      ),
    [month, locale]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("components.planner.searchPlaceholder", "Buscar posts...")}
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
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-28 text-center text-xs font-medium capitalize">{label}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="icon">
            <SlidersHorizontal className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium">{t("components.planner.filterClientLabel", "Cliente")}</p>
            <Select value={clientFilter} onValueChange={onClientFilterChange}>
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("components.planner.allClients", "Todos los clientes")}</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium">{t("components.planner.filterNetworkLabel", "Red")}</p>
            <Select value={networkFilter} onValueChange={onNetworkFilterChange}>
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("components.planner.allNetworks", "Todas las redes")}</SelectItem>
                {Object.entries(NETWORK_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium">{t("components.planner.filterCategoryLabel", "Categoría")}</p>
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("components.planner.allCategories", "Todas las categorías")}</SelectItem>
                {CATEGORY_ORDER.map((value) => (
                  <SelectItem key={value} value={value}>
                    {getCategoryLabel(value, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>

      <div className="border-border ml-auto flex items-center gap-0.5 rounded-lg border p-0.5">
        {VIEW_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant={view === opt.value ? "secondary" : "ghost"}
            size="icon"
            className="size-7"
            onClick={() => onViewChange(opt.value)}
            title={opt.label}
          >
            <opt.icon className="size-4" />
          </Button>
        ))}
      </div>
    </div>
  );
}

export function PlannerView({
  items,
  clients,
  folders,
  assets,
}: {
  items: ContentItemWithClient[];
  clients: { id: string; name: string }[];
  folders: MediaFolderWithCount[];
  assets: MediaAssetWithRelations[];
}) {
  const { t } = useLocale();
  const [view, setView] = React.useState<PlannerViewMode>("tablero");
  const [search, setSearch] = React.useState("");
  const [month, setMonth] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [clientFilter, setClientFilter] = React.useState("all");
  const [networkFilter, setNetworkFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  const published = items.filter((i) => i.status === "publicado");
  const igGrid = items.filter((i) => i.network === "instagram_feed");

  const filteredItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        (q === "" || item.title.toLowerCase().includes(q)) &&
        (clientFilter === "all" || item.client_id === clientFilter) &&
        (networkFilter === "all" || item.network === networkFilter) &&
        (categoryFilter === "all" || item.category === categoryFilter)
    );
  }, [items, search, clientFilter, networkFilter, categoryFilter]);

  // El Calendario necesita acotarse a un mes puntual para renderizar la
  // grilla; Tablero y Lista muestran todo lo filtrado (sin recorte por mes)
  // para no esconder el backlog real de la agencia al cambiar de vista.
  const calendarItems = React.useMemo(
    () => filteredItems.filter((item) => item.scheduled_at),
    [filteredItems]
  );

  return (
    <Tabs defaultValue="planner" className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="planner">{t("components.planner.tabPlanner", "Planner")}</TabsTrigger>
          <TabsTrigger value="publicados">{t("components.planner.tabPublicados", "Publicados")}</TabsTrigger>
          <TabsTrigger value="grilla-ig">{t("components.planner.tabGrillaIg", "Grilla IG")}</TabsTrigger>
          <TabsTrigger value="media">{t("nav.recursos.mediaLibrary", "Media Library")}</TabsTrigger>
        </TabsList>
        <NewContentDialog clients={clients} />
      </div>

      <TabsContent value="planner" className="space-y-3">
        <PlannerToolbar
          view={view}
          onViewChange={setView}
          search={search}
          onSearchChange={setSearch}
          month={month}
          onMonthChange={setMonth}
          clientFilter={clientFilter}
          onClientFilterChange={setClientFilter}
          networkFilter={networkFilter}
          onNetworkFilterChange={setNetworkFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          clients={clients}
        />

        {filteredItems.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t("components.planner.noMatchFilter", "No hay piezas que coincidan con el filtro.")}
          />
        ) : (
          <>
            {view === "tablero" && <PlannerBoard items={filteredItems} />}
            {view === "calendario" && (
              // Mismo criterio que content-calendar-view.tsx: 7 columnas con
              // mini-tarjetas (miniatura + título) nunca entran legibles en
              // un ancho de celular real — en vez de achicar el contenido de
              // cada celda hasta hacerlo ilegible, se deja un ancho mínimo
              // razonable y se scrollea horizontal (como cualquier calendario
              // mensual "de verdad" en mobile).
              <div className="w-full overflow-x-auto">
                <div className="min-w-[560px]">
                  <PlannerCalendar month={month} items={calendarItems} />
                </div>
              </div>
            )}
            {view === "lista" && <PlannerList items={filteredItems} />}
          </>
        )}
      </TabsContent>

      <TabsContent value="publicados">
        <div className="space-y-2">
          {published.length === 0 && (
            <EmptyState
              icon={Send}
              title={t("components.planner.noPublished", "Todavía no hay piezas publicadas.")}
            />
          )}
          {published.map((item) => {
            const network = NETWORK_META[item.network];
            return (
              <div key={item.id} className="glass-card flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
                    <network.icon className="size-3" /> {network.label} · {item.client_name}
                  </p>
                </div>
                {item.scheduled_at && (
                  <span className="text-muted-foreground shrink-0 text-xs">{formatDate(item.scheduled_at)}</span>
                )}
              </div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="grilla-ig">
        {igGrid.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title={t("components.planner.noIgFeed", "No hay piezas de Instagram Feed todavía.")}
          />
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-6">
            {igGrid.map((item) => (
              <div key={item.id} className={cn("bg-muted relative aspect-square overflow-hidden rounded-sm")}>
                {item.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail_url} alt={item.title} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ImageOff className="text-muted-foreground size-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="media">
        <MediaLibraryView folders={folders} assets={assets} clients={clients} />
      </TabsContent>
    </Tabs>
  );
}
