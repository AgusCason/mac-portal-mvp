import { requireRole } from "@/lib/auth";
import { getVaultCredentials, type VaultCredentialWithClient } from "@/lib/queries/vault";
import { getClients } from "@/lib/queries/clients";
import { VaultList, NewCredentialDialog } from "@/components/settings/vault-list";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { buildCsv, type CsvColumn } from "@/lib/export-csv";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";

// A propósito NUNCA incluye el secreto (getVaultCredentials ya ni lo trae de
// la base) — este export es un inventario de "qué credenciales existen", no
// una forma de sacar contraseñas en bloque de la Bóveda.
const VAULT_CSV_COLUMNS: CsvColumn<VaultCredentialWithClient>[] = [
  { header: "Título", value: (v) => v.label },
  { header: "Cliente", value: (v) => v.client_name },
  { header: "Usuario", value: (v) => v.username },
  { header: "URL", value: (v) => v.url },
  { header: "Creada", value: (v) => formatDate(v.created_at) },
  { header: "Actualizada", value: (v) => formatDate(v.updated_at) },
];

export default async function BovedaPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const [credentials, clients] = await Promise.all([getVaultCredentials(), getClients()]);
  const vaultCsv = buildCsv(VAULT_CSV_COLUMNS, credentials);
  const selectableClients = clients.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("nav.config.boveda", "Bóveda")}</h1>
          <p className="text-muted-foreground text-sm">
            {t(
              "pages.boveda.description",
              "Credenciales y accesos técnicos cifrados (Meta, dominios, hosting), con vínculo opcional a un cliente. Solo vos (admin) podés ver y usar esta pantalla."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton filename="boveda-metadata.csv" csv={vaultCsv} disabled={credentials.length === 0} />
          <NewCredentialDialog clients={selectableClients} />
        </div>
      </div>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{t("pages.boveda.savedCredentialsTitle", "Credenciales guardadas")}</CardTitle>
          <CardDescription>
            {t(
              "pages.boveda.savedCredentialsDesc",
              "El secreto se cifra con pgcrypto y solo se descifra bajo demanda con el botón del ojo."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VaultList credentials={credentials} clients={selectableClients} />
        </CardContent>
      </Card>
    </div>
  );
}
