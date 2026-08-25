import type { ContentCategory } from "@/types/database";

/**
 * Etiqueta de categoría de contenido — pill de color reutilizada en las 3
 * vistas del Planner (Tablero/Calendario/Lista) y en el diálogo de nueva
 * pieza. Clases Tailwind literales (no template strings): el compilador JIT
 * de Tailwind v4 no detecta clases armadas dinámicamente en runtime.
 */
export const CATEGORY_META: Record<
  ContentCategory,
  { label: string; dot: string; pill: string }
> = {
  comunidad: {
    label: "Comunidad",
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  producto: {
    label: "Producto",
    dot: "bg-violet-500",
    pill: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  educativo: {
    label: "Educativo",
    dot: "bg-blue-500",
    pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  promocion: {
    label: "Promoción",
    dot: "bg-orange-500",
    pill: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  caso_exito: {
    label: "Caso de éxito",
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
};

export const CATEGORY_ORDER: ContentCategory[] = [
  "comunidad",
  "producto",
  "educativo",
  "promocion",
  "caso_exito",
];
