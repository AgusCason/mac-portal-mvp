import { requireRole } from "@/lib/auth";
import { getEditors } from "@/lib/queries/team";
import { getEditorAssignedClients } from "@/lib/queries/editor";
import { NewEditorDialog } from "@/components/team/new-editor-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";

export default async function AdminEquipoPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const editors = await getEditors();
  const assignmentsByEditor = await Promise.all(
    editors.map((e) => getEditorAssignedClients(e.id))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("nav.equipo", "Equipo")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("pages.equipo.description", "Editores de la agencia y los clientes que tienen asignados.")}
          </p>
        </div>
        <NewEditorDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {editors.map((editor, i) => (
          <Card key={editor.id}>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <Avatar>
                <AvatarFallback>{getInitials(editor.full_name || editor.email)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm">{editor.full_name || t("pages.equipo.noName", "Sin nombre")}</CardTitle>
                <p className="text-muted-foreground text-xs">{editor.email}</p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {assignmentsByEditor[i].length === 0 && (
                <p className="text-muted-foreground text-xs">{t("pages.equipo.noClients", "Sin clientes asignados")}</p>
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
          <p className="text-muted-foreground text-sm">{t("pages.equipo.noEditors", "Todavía no invitaste editores.")}</p>
        )}
      </div>
    </div>
  );
}
