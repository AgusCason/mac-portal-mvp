import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Estado vacío estándar del portal — icon-chip + título + hint opcional,
 * dentro de una caja punteada. Reemplaza los `<p className="text-muted-
 * foreground py-10 text-center text-sm">` sueltos (sin ícono, sin caja) que
 * quedaron de antes del rediseño mockup-v2: esos leían "viejo" apenas una
 * cuenta no tenía datos todavía, que es exactamente cuando más se nota.
 * Mismo tratamiento que ya usaban a mano Redes/Envíos, pero reutilizable.
 */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center",
        className
      )}
    >
      <div className="icon-chip mb-1 !size-11">
        <Icon className="size-5" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-muted-foreground max-w-sm text-sm">{hint}</p>}
      {action}
    </div>
  );
}
