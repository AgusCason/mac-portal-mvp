import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  className?: string;
  /**
   * Antes cada tono pintaba el chip de un color distinto (info/warning/...).
   * Se dejó de usar: el acento de marca (verde) queda reservado solo para lo
   * activo/seleccionado (ver nav), así que el chip del KPI es siempre neutro
   * — el color real de "estado" sigue viviendo en las badges (aprobado,
   * requiere cambios, etc.), no acá. La prop se mantiene por compatibilidad
   * con los call-sites existentes, pero ya no cambia el estilo.
   */
  tone?: "primary" | "info" | "warning" | "success";
}

const TONE_CLASSES: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  primary: "bg-accent text-muted-foreground",
  info: "bg-accent text-muted-foreground",
  warning: "bg-accent text-muted-foreground",
  success: "bg-accent text-muted-foreground",
};

/** Card de KPI reutilizable: label en mayúsculas + valor grande tabular-nums + ícono. */
export function KpiCard({ label, value, icon: Icon, hint, className, tone = "primary" }: KpiCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {label}
          </p>
          <p className="tabular-nums text-2xl font-semibold">{value}</p>
        </div>
        <div className={cn("rounded-lg p-2", TONE_CLASSES[tone])}>
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
      </CardHeader>
      {hint && (
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-xs">{hint}</p>
        </CardContent>
      )}
    </Card>
  );
}
