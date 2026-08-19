import { requireRole } from "@/lib/auth";
import { getEditors } from "@/lib/queries/team";
import { getEditorAssignedClients } from "@/lib/queries/editor";
import { InviteUserDialog } from "@/components/team/invite-user-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

export default async function AdminEquipoPage() {
  await requireRole(["admin"]);
  const editors = await getEditors();
  const assignmentsByEditor = await Promise.all(
    editors.map((e) => getEditorAssignedClients(e.id))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Equipo</h1>
          <p className="text-muted-foreground text-sm">
            Editores de la agencia y los clientes que tienen asignados.
          </p>
        </div>
        <InviteUserDialog defaultRole="editor" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {editors.map((editor, i) => (
          <Card key={editor.id}>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <Avatar>
                <AvatarFallback>{getInitials(editor.full_name || editor.email)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm">{editor.full_name || "Sin nombre"}</CardTitle>
                <p className="text-muted-foreground text-xs">{editor.email}</p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {assignmentsByEditor[i].length === 0 && (
                <p className="text-muted-foreground text-xs">Sin clientes asignados</p>
              )}
              {assignmentsByEditor[i].map((a) => (
                <Badge key={a.client_id} variant="secondary">
                  {a.name}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
        {editors.length === 0 && (
          <p className="text-muted-foreground text-sm">Todavía no invitaste editores.</p>
        )}
      </div>
    </div>
  );
}
