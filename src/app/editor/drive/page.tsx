import { requireRole } from "@/lib/auth";
import { getEditorAssignedClients } from "@/lib/queries/editor";
import { ClientSelector } from "@/components/shared/client-selector";
import { DriveBrowser } from "@/components/drive/drive-browser";
import { getT } from "@/lib/i18n/dictionary";

export default async function EditorDrivePage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const profile = await requireRole(["editor"]);
  const t = getT(profile.language);
  const clients = await getEditorAssignedClients(profile.id);
  const { cliente } = await searchParams;
  const activeClientId = cliente ?? clients[0]?.client_id;
  const activeClient = clients.find((c) => c.client_id === activeClientId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("nav.editor.driveClientes", "Drive de clientes")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("pages.editorDrive.description", "Solo ves clientes donde el admin activó tu acceso a Drive.")}
        </p>
      </div>
      <ClientSelector clients={clients.filter((c) => c.can_view_drive)} />
      {activeClient && !activeClient.can_view_drive && (
        <p className="text-muted-foreground text-sm">
          {t("pages.editorDrive.noAccess", "No tenés permiso de Drive habilitado para este cliente.")}
        </p>
      )}
      {activeClient?.can_view_drive && <DriveBrowser clientId={activeClient.client_id} />}
    </div>
  );
}
