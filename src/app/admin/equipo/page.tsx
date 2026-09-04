import { Layers } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getEditors } from "@/lib/queries/team";
import { getEditorAssignedClients } from "@/lib/queries/editor";
import { NewEditorDialog } from "@/components/team/new-editor-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INITIALS_GRADIENTS } from "@/components/dashboard/billing-hero-card";
import { ProgressRing } from "@/components/shared/mini-charts";
import { getInitials, cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";

// Cuántos chips de cliente se muestran antes de colapsar el resto en un
// "+N más" — así todas las tarjetas de la grilla quedan con altura pareja
// aunque un editor tenga muchos más clientes asignados que otro.
const MAX_VISIBLE_CLIENTS = 5;

export default async function AdminEquipoPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const editors = await getEditors();
  const assignmentsByEditor = await Promise.all(
    editors.map((e) => getEditorAssignedClients(e.id))
  );
  const editorsWithClients = assignmentsByEditor.filter((a) => a.length > 0).length;
  const totalAssignedClients = assignmentsByEditor.reduce((sum, a) => sum + a.length, 0);

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

      {editors.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Ring real: editores CON al menos un cliente asignado, sobre el
              total de editores — nunca un % inventado. */}
          <Card className="flex-row items-center gap-3.5 p-4">
            <ProgressRing value={editorsWithClients} max={editors.length} color="var(--primary)" />
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">
                {t("pages.equipo.withClientsTitle", "Editores con clientes asignados")}
              </p>
              <p className="text-muted-foreground text-xs">
                {editorsWithClients} {t("pages.equipo.ofTotal", "de")} {editors.length}
              </p>
            </div>
          </Card>
          <Card className="flex-row items-center gap-3.5 p-4">
            <div className="icon-chip !size-14">
              <Layers className="size-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">
                {t("pages.equipo.totalAssignmentsTitle", "Asignaciones activas")}
              </p>
              <p className="tabular-nums text-2xl font-bold tracking-tighter">{totalAssignedClients}</p>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {editors.map((editor, i) => {
          const assignments = assignmentsByEditor[i];
          const visible = assignments.slice(0, MAX_VISIBLE_CLIENTS);
          const overflow = assignments.length - visible.length;
          return (
            <Card key={editor.id} className="glass-card">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-extrabold",
                    INITIALS_GRADIENTS[i % INITIALS_GRADIENTS.length]
                  )}
                >
                  {getInitials(editor.full_name || editor.email)}
                </span>
                <div className="min-w-0">
                  <CardTitle className="truncate text-sm">{editor.full_name || t("pages.equipo.noName", "Sin nombre")}</CardTitle>
                  <p className="text-muted-foreground truncate text-xs">{editor.email}</p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {assignments.length === 0 && (
                  <p className="text-muted-foreground text-xs">{t("pages.equipo.noClients", "Sin clientes asignados")}</p>
                )}
                {visible.map((a) => (
                  <span
                    key={a.client_id}
                    className="bg-accent/60 text-foreground/80 rounded-full px-2.5 py-1 text-xs font-medium"
                  >
                    {a.name}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="bg-accent/60 text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium">
                    +{overflow} {t("pages.equipo.more", "más")}
                  </span>
                )}
              </CardContent>
            </Card>
          );
        })}
        {editors.length === 0 && (
          <p className="text-muted-foreground text-sm">{t("pages.equipo.noEditors", "Todavía no invitaste editores.")}</p>
        )}
      </div>
    </div>
  );
}
