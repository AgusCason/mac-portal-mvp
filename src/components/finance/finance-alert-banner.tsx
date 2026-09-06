import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Franja de alerta compacta para los paneles de Finanzas — "vencido" (rojo)
 * cuenta más que "urgente" (amarillo), así que si hay al menos un vencido se
 * usa el tono destructivo aunque también haya urgentes; el texto siempre
 * detalla ambos números por separado.
 */
export function FinanceAlertBanner({
  overdueCount,
  urgentCount,
  overdueLabel,
  urgentLabel,
}: {
  overdueCount: number;
  urgentCount: number;
  overdueLabel: string;
  urgentLabel: string;
}) {
  if (overdueCount === 0 && urgentCount === 0) return null;
  const tone = overdueCount > 0 ? "destructive" : "warning";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
        tone === "destructive" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-warning/30 bg-warning/10 text-warning"
      )}
    >
      {tone === "destructive" ? <AlertTriangle className="size-3.5 shrink-0" /> : <Clock className="size-3.5 shrink-0" />}
      <span>
        {overdueCount > 0 && `${overdueCount} ${overdueLabel}`}
        {overdueCount > 0 && urgentCount > 0 && " · "}
        {urgentCount > 0 && `${urgentCount} ${urgentLabel}`}
      </span>
    </div>
  );
}
