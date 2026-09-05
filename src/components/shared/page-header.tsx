import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Encabezado estándar de página — misma tipografía "hero" que ya usaba el
 * dashboard de bienvenida (título grande y bien negro, tracking apretado)
 * en vez del `<h1 className="text-xl font-semibold tracking-tight">` chico
 * que tenían el resto de las ~50 páginas del portal. Es la pieza que hace
 * que, apenas entrás a cualquier sección, se sienta la misma calidad visual
 * que en /admin — no solo la de bienvenida.
 *
 * `title`/`description` aceptan ReactNode para no perder casos puntuales
 * como el badge de "· 4 activas de 6" en Cuentas o el nombre del agente en
 * color primario en Asistente. `actions` va a la derecha (botones, diálogos
 * de alta) y se acomoda debajo del título en mobile.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-primary mb-2 text-[10px] font-bold tracking-[0.16em] uppercase">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">{title}</h1>
        {description && <p className="text-muted-foreground mt-2 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
