"use client";

import type { ContentItemWithClient } from "@/lib/queries/content";
import type { UserRole } from "@/types/database";
import { STATUS_META, getStatusLabel } from "@/components/dashboard/content-status-badge";
import { NETWORK_META } from "@/lib/network-meta";
import { DeliverContentDialog } from "@/components/content/deliver-content-dialog";
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
import { formatDate } from "@/lib/utils";

/**
 * Vista lista ordenada por fecha límite (deadline) — pensada para que el
 * editor priorice de un vistazo qué entregar primero. Las piezas sin fecha
 * programada quedan al final.
 */
export function ContentList({
  items,
  role,
}: {
  items: ContentItemWithClient[];
  role: UserRole;
}) {
  const { t } = useLocale();
  const sorted = [...items].sort((a, b) => {
    if (!a.scheduled_at && !b.scheduled_at) return 0;
    if (!a.scheduled_at) return 1;
    if (!b.scheduled_at) return -1;
    return a.scheduled_at.localeCompare(b.scheduled_at);
  });

  const canDeliver = role === "admin" || role === "editor";

  if (sorted.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("components.content.noItemsToShow", "No hay piezas para mostrar.")}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("components.content.tableHeaderPiece", "Pieza")}</TableHead>
          {role !== "client" && <TableHead>{t("components.content.tableHeaderClient", "Cliente")}</TableHead>}
          <TableHead>{t("components.content.tableHeaderNetwork", "Red")}</TableHead>
          <TableHead>{t("components.content.tableHeaderDueDate", "Fecha límite")}</TableHead>
          <TableHead>{t("components.content.tableHeaderStatus", "Estado")}</TableHead>
          {canDeliver && <TableHead className="text-right">{t("components.content.tableHeaderAction", "Acción")}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((item) => {
          const meta = STATUS_META[item.status];
          const network = NETWORK_META[item.network];
          return (
            <TableRow key={item.id}>
              <TableCell className="max-w-[16rem] truncate font-medium">{item.title}</TableCell>
              {role !== "client" && (
                <TableCell className="text-muted-foreground">{item.client_name}</TableCell>
              )}
              <TableCell className="text-muted-foreground">{network.label}</TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {item.scheduled_at ? formatDate(item.scheduled_at) : t("components.content.noDate", "Sin fecha")}
              </TableCell>
              <TableCell>
                <Badge variant={meta.variant}>
                  <meta.icon /> {getStatusLabel(item.status, t)}
                </Badge>
              </TableCell>
              {canDeliver && (
                <TableCell className="text-right">
                  {item.status === "en_edicion" && (
                    <DeliverContentDialog
                      contentId={item.id}
                      clientId={item.client_id}
                      title={item.title}
                    />
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
