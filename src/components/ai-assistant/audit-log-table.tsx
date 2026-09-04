"use client";

import { History } from "lucide-react";
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
import { EmptyState } from "@/components/shared/empty-state";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/dictionary";

const STATUS_LABEL_KEY: Record<AiActionStatus, { key: string; fallback: string }> = {
  proposed: { key: "components.aiAssistant.statusProposed", fallback: "Propuesto" },
  confirmed: { key: "components.aiAssistant.statusConfirmed", fallback: "Confirmado" },
  executed: { key: "components.aiAssistant.statusExecuted", fallback: "Aplicado" },
  rejected: { key: "components.aiAssistant.statusRejected", fallback: "Rechazado" },
  failed: { key: "components.aiAssistant.statusFailed", fallback: "Falló" },
};

const STATUS_VARIANT: Record<AiActionStatus, "success" | "warning" | "destructive" | "secondary"> = {
  proposed: "warning",
  confirmed: "warning",
  executed: "success",
  rejected: "secondary",
  failed: "destructive",
};

const DATE_LOCALE: Record<Locale, string> = { es: "es-AR", en: "en-US" };

/**
 * Historial de auditoría de todo lo que el asistente propuso — visible para
 * cualquier admin, más allá de quién haya iniciado la conversación (ver
 * policy `ai_audit_log_admin_select`). Es la pieza que responde "¿qué tocó
 * la IA y qué pasó con eso?" en cualquier momento.
 */
export function AuditLogTable({ entries }: { entries: AiAuditLog[] }) {
  const { t, locale } = useLocale();

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title={t(
          "components.aiAssistant.auditEmptyState",
          "Todavía no hay propuestas registradas en la auditoría del asistente."
        )}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("components.aiAssistant.colDate", "Fecha")}</TableHead>
            <TableHead>{t("components.aiAssistant.colAction", "Acción")}</TableHead>
            <TableHead>{t("components.aiAssistant.colSummary", "Resumen")}</TableHead>
            <TableHead>{t("components.aiAssistant.colStatus", "Estado")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                {new Date(entry.created_at).toLocaleString(DATE_LOCALE[locale], {
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
                <Badge variant={STATUS_VARIANT[entry.status]}>
                  {t(STATUS_LABEL_KEY[entry.status].key, STATUS_LABEL_KEY[entry.status].fallback)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
