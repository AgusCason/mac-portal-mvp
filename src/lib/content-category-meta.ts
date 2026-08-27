import type { ContentCategory } from "@/types/database";

type TFunc = (path: string, fallback?: string) => string;

/**
 * Etiqueta de categoría de contenido — pill de color reutilizada en las 3
 * vistas del Planner (Tablero/Calendario/Lista) y en el diálogo de nueva
 * pieza. Clases Tailwind literales (no template strings): el compilador JIT
 * de Tailwind v4 no detecta clases armadas dinámicamente en runtime.
 */
export const CATEGORY_META: Record<
  ContentCategory,
  { labelKey: string; fallback: string; dot: string; pill: string }
> = {
  comunidad: {
    labelKey: "components.category.comunidad",
    fallback: "Comunidad",
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  producto: {
    labelKey: "components.category.producto",
    fallback: "Producto",
    dot: "bg-violet-500",
    pill: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  educativo: {
    labelKey: "components.category.educativo",
    fallback: "Educativo",
    dot: "bg-blue-500",
    pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  promocion: {
    labelKey: "components.category.promocion",
    fallback: "Promoción",
    dot: "bg-orange-500",
    pill: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  caso_exito: {
    labelKey: "components.category.casoExito",
    fallback: "Caso de éxito",
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

/** Igual criterio que `getStatusLabel()` de `content-status-badge.tsx`: `t` opcional, cae al español. */
export function getCategoryLabel(category: ContentCategory, t?: TFunc): string {
  const meta = CATEGORY_META[category];
  return t ? t(meta.labelKey, meta.fallback) : meta.fallback;
}
