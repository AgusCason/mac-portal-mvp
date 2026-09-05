import { requireRole } from "@/lib/auth";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { DriveBrowser } from "@/components/drive/drive-browser";
import { ClientUploadDropzone } from "@/components/drive/client-upload-dropzone";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

export default async function ClientDrivePage() {
  const profile = await requireRole(["client"]);
  const t = getT(profile.language);
  const clientId = await getPrimaryClientId(profile.id);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.clientDrive.title", "Tus archivos")}
        description={t("pages.clientDrive.description", "Subí tus clips sin editar y descargá los entregables finales.")}
      />
      {clientId ? (
        <>
          <ClientUploadDropzone clientId={clientId} />
          <DriveBrowser clientId={clientId} />
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          {t("pages.client.noClientLinked", "Tu cuenta todavía no está vinculada a ningún cliente.")}
        </p>
      )}
    </div>
  );
}
