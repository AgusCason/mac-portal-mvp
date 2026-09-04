"use client";

import type * as React from "react";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { getAuditActionLabel } from "@/lib/audit-labels";
import { formatDate, formatTime } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import type { AuditLogEntryWithRelations } from "@/lib/queries/audit-log";

const ACTION_VARIANT: Record<string, React.ComponentProps<typeof Badge>["variant"]> = {
  "invoice.marked_paid": "success",
  "invoice.cancelled": "destructive",
  "invoice.amount_changed": "warning",
  "vault.credential_revealed": "warning",
  "vault.credential_deleted": "destructive",
  "security.blocked": "destructive",
  "security.alert": "warning",
};

/**
 * Configuración > Auditoría — tabla de solo lectura (no hay acciones que
 * tomar acá, es un registro). Se llena sola vía triggers/funciones de la
 * base — ver 0026_audit_log.sql.
 */
export function AuditLogTable({ entries }: { entries: AuditLogEntryWithRelations[] }) {
  const { t } = useLocale();

  if (entries.length === 0) {
    return <EmptyState icon={History} title={t("audit.emptyState", "Todavía no hay actividad registrada.")} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("audit.colDate", "Fecha")}</TableHead>
            <TableHead>{t("audit.colWho", "Quién")}</TableHead>
            <TableHead>{t("audit.colAction", "Acción")}</TableHead>
            <TableHead>{t("audit.colClient", "Cliente")}</TableHead>
            <TableHead>{t("audit.colDetail", "Detalle")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                {formatDate(entry.created_at)} · {formatTime(entry.created_at)}
              </TableCell>
              <TableCell className="text-sm">
                {entry.actor_name ?? t("audit.systemFallback", "Sistema")}
              </TableCell>
              <TableCell>
                <Badge variant={ACTION_VARIANT[entry.action_type] ?? "secondary"}>
                  {getAuditActionLabel(entry.action_type, t)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {entry.client_name ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-md text-xs">
                {entry.summary}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
