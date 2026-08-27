import { requireRole } from "@/lib/auth";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { DriveBrowser } from "@/components/drive/drive-browser";
import { ClientUploadDropzone } from "@/components/drive/client-upload-dropzone";
import { getT } from "@/lib/i18n/dictionary";

export default async function ClientDrivePage() {
  const profile = await requireRole(["client"]);
  const t = getT(profile.language);
  const clientId = await getPrimaryClientId(profile.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("pages.clientDrive.title", "Tus archivos")}</h1>
        <p className="text-muted-foreground text-sm">
          Subí tus clips sin editar y descargá los entregables finales.
        </p>
      </div>
      {clientId ? (
        <>
          <ClientUploadDropzone clientId={clientId} />
          <DriveBrowser clientId={clientId} />
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Tu cuenta todavía no está vinculada a ningún cliente.
        </p>
      )}
    </div>
  );
}
