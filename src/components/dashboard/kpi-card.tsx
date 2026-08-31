import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  className?: string;
  /** Color del ícono/chip — cada tono usa los mismos tokens semánticos que las badges de estado. */
  tone?: "primary" | "info" | "warning" | "success";
}

const TONE_CLASSES: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/15 text-info",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/15 text-success",
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
