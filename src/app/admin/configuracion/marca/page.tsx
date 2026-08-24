import { requireRole } from "@/lib/auth";
import { getBranding } from "@/lib/queries/branding";
import { BrandingForm } from "@/components/settings/branding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MarcaPage() {
  await requireRole(["admin"]);
  const branding = await getBranding();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Marca</h1>
        <p className="text-muted-foreground text-sm">
          Nombre, logos y colores white-label de la plataforma — se aplican a todo el portal
          (los 3 roles) apenas guardás.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Identidad de marca</CardTitle>
          <CardDescription>Solo vos (admin) podés ver y editar esta pantalla.</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingForm branding={branding} />
        </CardContent>
      </Card>
    </div>
  );
}
