import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/i18n/dictionary";

export default async function AdminConfiguracionPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("pages.configuracion.title", "Configuración")}</h1>
        <p className="text-muted-foreground text-sm">
          Integraciones y datos generales de la agencia.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Integraciones</CardTitle>
          <CardDescription>
            Se configuran por variables de entorno — ver README.md y .env.example.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-1 text-sm">
          <p>Google Drive (Service Account): estructura de carpetas por cliente.</p>
          <p>WhatsApp Cloud API: webhook en /api/webhooks/whatsapp.</p>
          <p>Meta Graph API: conexión OAuth en /api/oauth/meta/connect.</p>
        </CardContent>
      </Card>
    </div>
  );
}
