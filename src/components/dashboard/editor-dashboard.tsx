import Link from "next/link";
import { FolderOpen, MessageCircleWarning, CalendarClock, Users } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/dictionary";
import { formatDate } from "@/lib/utils";
import type { EditorDashboardData } from "@/lib/queries/dashboard";
import type { Profile } from "@/types/database";

/** Vista del dashboard para el Editor: solo sus clientes asignados, sin datos financieros. */
export function EditorDashboard({ data, profile }: { data: EditorDashboardData; profile: Profile }) {
  const t = getT(profile.language);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("components.dashboard.editorTitle", "Mi trabajo")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("components.dashboard.editorDesc", "Tareas pendientes, entregas próximas y clientes asignados.")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label={t("components.dashboard.kpiAssignedClients", "Clientes asignados")}
          value={data.assignedClients.length}
          icon={Users}
          tone="primary"
        />
        <KpiCard
          label={t("components.dashboard.kpiChangesRequested", "Con cambios pedidos")}
          value={data.myContentByStatus.requiere_cambios}
          icon={MessageCircleWarning}
          tone="warning"
        />
        <KpiCard
          label={t("components.dashboard.kpiUpcomingDeliveries", "Próximas entregas")}
          value={data.upcoming.length}
          icon={CalendarClock}
          tone="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("components.dashboard.needsChangesTitle", "Requieren cambios")}</CardTitle>
            <CardDescription>{t("components.dashboard.needsChangesDesc", "Feedback del cliente pendiente de resolver.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.needsChanges.length === 0 && (
              <p className="text-muted-foreground text-sm">{t("components.dashboard.noChangesPending", "Todo al día — sin cambios pendientes.")}</p>
            )}
            {data.needsChanges.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="bg-accent text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                  <MessageCircleWarning className="size-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-xs">{item.client_name}</p>
                </div>
                <Badge variant="destructive">{t("components.dashboard.review", "Revisar")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("components.dashboard.myClientsTitle", "Mis clientes")}</CardTitle>
            <CardDescription>{t("components.dashboard.myClientsDesc", "Con los permisos que te asignó el admin.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.assignedClients.map((c) => (
              <div
                key={c.client_id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="bg-accent text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                  <Users className="size-4" strokeWidth={1.75} />
                </span>
                <span className="flex-1 truncate font-medium">{c.name}</span>
                <div className="flex gap-1.5">
                  <Badge variant={c.can_view_drive ? "info" : "outline"}>
                    <FolderOpen /> Drive
                  </Badge>
                  <Badge variant={c.can_view_chat ? "info" : "outline"}>Chat</Badge>
                </div>
              </div>
            ))}
            <Button asChild variant="ghost" size="sm" className="mt-1 w-full">
              <Link href="/editor/drive">{t("components.dashboard.goToClientDrive", "Ir al Drive de clientes")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("components.dashboard.upcomingDeliveriesTitle", "Próximas entregas")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.upcoming.length === 0 && (
            <p className="text-muted-foreground text-sm">{t("components.dashboard.noUpcomingDeliveries", "No hay entregas programadas todavía.")}</p>
          )}
          {data.upcoming.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <span className="bg-accent text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                <CalendarClock className="size-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.title}</p>
                <p className="text-muted-foreground text-xs">{item.client_name}</p>
              </div>
              <span className="text-muted-foreground shrink-0 tabular-nums text-xs">
                {formatDate(item.scheduled_at)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
