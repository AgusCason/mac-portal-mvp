"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary de Next.js para el árbol de rutas (no existía ninguno
 * antes en toda la app — un error sin manejar en un Server Component
 * mostraba la pantalla default de Next, sin marca ni forma de recuperarse
 * sin recargar). Vive por arriba de los layouts de rol (admin/client/editor),
 * así que no tiene acceso a `useLocale()` (el provider vive adentro de
 * `AppShell`) — texto fijo en español, el idioma default del portal.
 *
 * El error real solo se loguea a la consola del browser acá — nunca se
 * muestra `error.message`/stack al usuario, para no filtrar detalles
 * internos (nombres de tabla, mensajes de Postgres, etc.).
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4 text-center">
      <span className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" strokeWidth={1.75} />
      </span>
      <h1 className="text-lg font-semibold">Algo salió mal</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Hubo un error inesperado al cargar esta página. Podés intentar de nuevo, o volver a tu panel si el problema sigue.
      </p>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={() => reset()}>
          <RotateCcw className="size-3.5" /> Reintentar
        </Button>
        <Button asChild size="sm">
          <Link href="/dashboard">Volver a mi panel</Link>
        </Button>
      </div>
    </div>
  );
}
