import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NoAutorizadoPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4 text-center">
      <ShieldAlert className="text-destructive size-10" strokeWidth={1.5} />
      <h1 className="text-lg font-semibold">No tenés acceso a esta sección</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Tu cuenta no tiene permisos para ver esta página. Si creés que es un error,
        contactá a la agencia.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard">Volver a mi panel</Link>
      </Button>
    </div>
  );
}
