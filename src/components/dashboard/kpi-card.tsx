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

/**
 * Card de KPI reutilizable — header con ícono a la izquierda + título en
 * minúsculas (patrón "billing-card"/"accounts-card" del mockup de dashboard
 * aprobado, ver charla) en vez del label chico en mayúsculas de antes. Valor
 * grande (36px, tracking bien apretado) tabular-nums debajo.
 */
export function KpiCard({ label, value, icon: Icon, hint, className }: KpiCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3">
          {/* .icon-chip (globals.css) — mismo tratamiento en todas las
              KpiCard del portal, ver comentario de `tone` arriba: ya no varía
              por tono, así que no hace falta más que la clase fija. */}
          <div className="icon-chip">
            <Icon className="size-4" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-semibold tracking-tight">{label}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        <p className="tabular-nums text-4xl font-bold tracking-tighter">{value}</p>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
