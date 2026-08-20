import type { AiAuditLog, AiActionStatus } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<AiActionStatus, string> = {
  proposed: "Propuesto",
  confirmed: "Confirmado",
  executed: "Aplicado",
  rejected: "Rechazado",
  failed: "Falló",
};

const STATUS_VARIANT: Record<AiActionStatus, "success" | "warning" | "destructive" | "secondary"> = {
  proposed: "warning",
  confirmed: "warning",
  executed: "success",
  rejected: "secondary",
  failed: "destructive",
};

/**
 * Historial de auditoría de todo lo que el asistente propuso — visible para
 * cualquier admin, más allá de quién haya iniciado la conversación (ver
 * policy `ai_audit_log_admin_select`). Es la pieza que responde "¿qué tocó
 * la IA y qué pasó con eso?" en cualquier momento.
 */
export function AuditLogTable({ entries }: { entries: AiAuditLog[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Todavía no hay propuestas registradas en la auditoría del asistente.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Acción</TableHead>
          <TableHead>Resumen</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
              {new Date(entry.created_at).toLocaleString("es-AR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </TableCell>
            <TableCell className="whitespace-nowrap font-mono text-xs">{entry.action_type}</TableCell>
            <TableCell className="max-w-md text-sm">
              {entry.summary}
              {entry.error && <p className="text-destructive mt-1 text-xs">{entry.error}</p>}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[entry.status]}>{STATUS_LABEL[entry.status]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
