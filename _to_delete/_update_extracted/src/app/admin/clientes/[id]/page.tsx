import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getClientDetail } from "@/lib/queries/clients";
import { getEditors } from "@/lib/queries/team";
import { getUnlinkedClientProfiles } from "@/lib/queries/unlinked-clients";
import { AssignEditorDialog } from "@/components/clients/assign-editor-dialog";
import { LinkClientMemberDialog } from "@/components/clients/link-client-member-dialog";
import { DriveBrowser } from "@/components/drive/drive-browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CalendarDays, FileSignature, FolderOpen } from "lucide-react";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;
  const [detail, editors, unlinkedClientProfiles] = await Promise.all([
    getClientDetail(id),
    getEditors(),
    getUnlinkedClientProfiles(id),
  ]);

  if (!detail) notFound();
  const { client, planName, assignments, contentCount, contractCount, driveFolders } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground text-sm">
            {client.brand_name ?? "Sin nombre de marca"} · {client.contact_email ?? "sin email"}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={client.status === "active" ? "success" : "secondary"}>
            {client.status === "active" ? "Activo" : client.status === "paused" ? "Pausado" : "Perdido"}
          </Badge>
          {planName && <Badge variant="info">Plan {planName}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Piezas de contenido" value={contentCount} icon={CalendarDays} />
        <KpiCard label="Contratos" value={contractCount} icon={FileSignature} />
        <KpiCard label="Carpetas en Drive" value={driveFolders.length} icon={FolderOpen} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Editores asignados</CardTitle>
          <AssignEditorDialog clientId={client.id} editors={editors} />
        </CardHeader>
        <CardContent className="space-y-2">
          {assignments.length === 0 && (
            <p className="text-muted-foreground text-sm">Sin editores asignados todavía.</p>
          )}
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span className="font-medium">{a.editor_name}</span>
              <div className="flex gap-1.5">
                <Badge variant={a.can_view_drive ? "info" : "outline"}>Drive</Badge>
                <Badge variant={a.can_view_chat ? "info" : "outline"}>Chat</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Usuario del portal cliente</CardTitle>
          <LinkClientMemberDialog clientId={client.id} candidates={unlinkedClientProfiles} />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Vinculá acá la cuenta con la que este cliente va a loguearse a ver su portal.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Drive</CardTitle>
        </CardHeader>
        <CardContent>
          {driveFolders.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Las carpetas de Drive todavía no se crearon (revisá las credenciales de la
              Service Account en .env.local).
            </p>
          ) : (
            <DriveBrowser clientId={client.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
