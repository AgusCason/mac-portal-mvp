import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 404 propio — antes de esto, cualquier URL inexistente (typo, link viejo,
 * ID borrado) mostraba el 404 default de Next, sin marca ni forma fácil de
 * volver. Mismo criterio que `error.tsx`: vive por arriba de los layouts de
 * rol, sin `useLocale()` disponible, texto fijo en español.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4 text-center">
      <span className="bg-accent text-muted-foreground flex size-14 items-center justify-center rounded-full">
        <Compass className="size-6" strokeWidth={1.75} />
      </span>
      <h1 className="text-lg font-semibold">Página no encontrada</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        La página que buscás no existe o se movió. Revisá el link, o volvé a tu panel.
      </p>
      <Button asChild size="sm">
        <Link href="/dashboard">Volver a mi panel</Link>
      </Button>
    </div>
  );
}
