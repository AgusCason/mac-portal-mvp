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
import { formatDate } from "@/lib/utils";
import type { EditorDashboardData } from "@/lib/queries/dashboard";

/** Vista del dashboard para el Editor: solo sus clientes asignados, sin datos financieros. */
export function EditorDashboard({ data }: { data: EditorDashboardData }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mi trabajo</h1>
        <p className="text-muted-foreground text-sm">
          Tareas pendientes, entregas próximas y clientes asignados.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Clientes asignados" value={data.assignedClients.length} icon={Users} />
        <KpiCard
          label="Con cambios pedidos"
          value={data.myContentByStatus.requiere_cambios}
          icon={MessageCircleWarning}
        />
        <KpiCard
          label="Próximas entregas"
          value={data.upcoming.length}
          icon={CalendarClock}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requieren cambios</CardTitle>
            <CardDescription>Feedback del cliente pendiente de resolver.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.needsChanges.length === 0 && (
              <p className="text-muted-foreground text-sm">Todo al día — sin cambios pendientes.</p>
            )}
            {data.needsChanges.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-xs">{item.client_name}</p>
                </div>
                <Badge variant="destructive">Revisar</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis clientes</CardTitle>
            <CardDescription>Con los permisos que te asignó el admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.assignedClients.map((c) => (
              <div
                key={c.client_id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium">{c.name}</span>
                <div className="flex gap-1.5">
                  <Badge variant={c.can_view_drive ? "info" : "outline"}>
                    <FolderOpen /> Drive
                  </Badge>
                  <Badge variant={c.can_view_chat ? "info" : "outline"}>Chat</Badge>
                </div>
              </div>
            ))}
            <Button asChild variant="ghost" size="sm" className="mt-1 w-full">
              <Link href="/editor/drive">Ir al Drive de clientes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas entregas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.upcoming.length === 0 && (
            <p className="text-muted-foreground text-sm">No hay entregas programadas todavía.</p>
          )}
          {data.upcoming.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground text-xs">{item.client_name}</p>
              </div>
              <span className="text-muted-foreground tabular-nums text-xs">
                {formatDate(item.scheduled_at)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
