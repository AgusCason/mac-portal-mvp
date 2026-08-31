import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton genérico para los `loading.tsx` de cada rol — Next.js lo muestra
 * de inmediato como fallback de <Suspense> apenas se navega a una nueva
 * sección, mientras esa página resuelve sus propias queries (ver
 * node_modules/next/dist/docs/01-app/02-guides/streaming.md). El sidebar y
 * el topbar del AppShell quedan fijos por fuera de este boundary — nunca
 * se re-renderizan ni parpadean, solo el área de contenido muestra esto un
 * instante.
 */
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
