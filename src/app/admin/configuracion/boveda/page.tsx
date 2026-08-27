import { requireRole } from "@/lib/auth";
import { getVaultCredentials } from "@/lib/queries/vault";
import { getClients } from "@/lib/queries/clients";
import { VaultList } from "@/components/settings/vault-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/i18n/dictionary";

export default async function BovedaPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const [credentials, clients] = await Promise.all([getVaultCredentials(), getClients()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("nav.config.boveda", "Bóveda")}</h1>
        <p className="text-muted-foreground text-sm">
          Credenciales y accesos técnicos cifrados (Meta, dominios, hosting), con vínculo opcional
          a un cliente. Solo vos (admin) podés ver y usar esta pantalla.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Credenciales guardadas</CardTitle>
          <CardDescription>
            El secreto se cifra con pgcrypto y solo se descifra bajo demanda con el botón del ojo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VaultList
            credentials={credentials}
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
