import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUDIT_ACTION_LABELS } from "@/lib/audit-labels";
import { formatDate, formatTime } from "@/lib/utils";
import type { AuditLogEntryWithRelations } from "@/lib/queries/audit-log";

const ACTION_VARIANT: Record<string, React.ComponentProps<typeof Badge>["variant"]> = {
  "invoice.marked_paid": "success",
  "invoice.cancelled": "destructive",
  "invoice.amount_changed": "warning",
  "vault.credential_revealed": "warning",
  "vault.credential_deleted": "destructive",
};

/**
 * Configuración > Auditoría — tabla de solo lectura (no hay acciones que
 * tomar acá, es un registro). Se llena sola vía triggers/funciones de la
 * base — ver 0026_audit_log.sql.
 */
export function AuditLogTable({ entries }: { entries: AuditLogEntryWithRelations[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        Todavía no hay actividad registrada.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Quién</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Detalle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                {formatDate(entry.created_at)} · {formatTime(entry.created_at)}
              </TableCell>
              <TableCell className="text-sm">{entry.actor_name ?? "Sistema"}</TableCell>
              <TableCell>
                <Badge variant={ACTION_VARIANT[entry.action_type] ?? "secondary"}>
                  {AUDIT_ACTION_LABELS[entry.action_type] ?? entry.action_type}
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
