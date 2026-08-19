import { requireRole } from "@/lib/auth";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { DriveBrowser } from "@/components/drive/drive-browser";

export default async function ClientDrivePage() {
  const profile = await requireRole(["client"]);
  const clientId = await getPrimaryClientId(profile.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tus archivos</h1>
        <p className="text-muted-foreground text-sm">
          Subí tus clips sin editar y descargá los entregables finales.
        </p>
      </div>
      {clientId ? (
        <DriveBrowser clientId={clientId} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Tu cuenta todavía no está vinculada a ningún cliente.
        </p>
      )}
    </div>
  );
}
