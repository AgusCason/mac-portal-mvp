import { requireRole } from "@/lib/auth";
import { getBranding } from "@/lib/queries/branding";
import { BrandingForm } from "@/components/settings/branding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

export default async function MarcaPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const branding = await getBranding();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.config.marca", "Marca")}
        description={t(
          "pages.marca.description",
          "Nombre, logos y colores white-label de la plataforma — se aplican a todo el portal (los 3 roles) apenas guardás."
        )}
      />
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{t("pages.marca.identityTitle", "Identidad de marca")}</CardTitle>
          <CardDescription>{t("pages.marca.identityDesc", "Solo vos (admin) podés ver y editar esta pantalla.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingForm branding={branding} />
        </CardContent>
      </Card>
    </div>
  );
}
