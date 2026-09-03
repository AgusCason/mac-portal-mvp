"use client";

import { ImageOff } from "lucide-react";

import type { ContentItemWithClient } from "@/lib/queries/content";
import { STATUS_META, getStatusLabel } from "@/components/dashboard/content-status-badge";
import { CATEGORY_META, getCategoryLabel } from "@/lib/content-category-meta";
import { NETWORK_META } from "@/lib/network-meta";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn, formatDate, formatTime } from "@/lib/utils";

/**
 * Vista "Lista" del Planner — tabla compacta (Estado/Programación/Visual/
 * Contenido/Etiquetas/Canal/Formato), estilo MB Suite.
 */
export function PlannerList({ items }: { items: ContentItemWithClient[] }) {
  const { t } = useLocale();
  const sorted = [...items].sort((a, b) =>
    (b.scheduled_at ?? b.created_at).localeCompare(a.scheduled_at ?? a.created_at)
  );

  if (sorted.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed py-8 text-center text-sm">
        {t("components.planner.noPiecesThisMonth", "No hay piezas para este mes.")}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("components.planner.tableStatus", "Estado")}</TableHead>
            <TableHead>{t("components.planner.tableSchedule", "Programación")}</TableHead>
            <TableHead>{t("components.planner.tableVisual", "Visual")}</TableHead>
            <TableHead>{t("components.planner.tableContent", "Contenido")}</TableHead>
            <TableHead>{t("components.planner.tableTags", "Etiquetas")}</TableHead>
            <TableHead>{t("components.planner.tableChannel", "Canal")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item) => {
            const meta = STATUS_META[item.status];
            const network = NETWORK_META[item.network];
            const NetworkIcon = network.icon;
            const category = item.category ? getCategoryLabel(item.category, t) : null;
            const categoryDot = item.category ? CATEGORY_META[item.category].dot : null;
            const categoryPill = item.category ? CATEGORY_META[item.category].pill : null;
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant={meta.variant}>
                    <meta.icon /> {getStatusLabel(item.status, t)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {item.scheduled_at ? (
                    <>
                      <p className="font-medium">{formatDate(item.scheduled_at)}</p>
                      <p className="text-muted-foreground">{formatTime(item.scheduled_at)}</p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">{t("components.content.noDate", "Sin fecha")}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="bg-muted relative size-10 overflow-hidden rounded-md">
                    {item.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnail_url} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <ImageOff className="text-muted-foreground size-4" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs whitespace-normal">
                  <p className="line-clamp-2 text-sm">{item.title}</p>
                  <p className="text-muted-foreground text-xs">{item.client_name}</p>
                </TableCell>
                <TableCell>
                  {category ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                        categoryPill
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", categoryDot)} />
                      {category}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <NetworkIcon className="size-3.5" />
                    {network.label}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
