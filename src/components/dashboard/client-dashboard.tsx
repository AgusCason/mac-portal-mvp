import Link from "next/link";
import { Eye, FileSignature, Sparkles } from "lucide-react";
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
import type { ClientDashboardData } from "@/lib/queries/dashboard";

/** Vista del dashboard para el portal de Cliente (marca / creador). */
export function ClientDashboard({ data }: { data: ClientDashboardData }) {
  const publicado = data.contentByStatus.publicado;
  const aprobado = data.contentByStatus.aprobado;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Hola, {data.client?.brand_name ?? data.client?.name ?? ""}
          </h1>
          <p className="text-muted-foreground text-sm">
            Así viene tu contenido este mes.
          </p>
        </div>
        {data.planName && <Badge variant="info">Plan {data.planName}</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Esperando tu aprobación"
          value={data.pendingReview.length}
          icon={Eye}
        />
        <KpiCard label="Aprobado / listo" value={aprobado} icon={Sparkles} />
        <KpiCard
          label="Contratos pendientes"
          value={data.pendingContracts}
          icon={FileSignature}
          hint={data.pendingContracts > 0 ? "Requieren tu firma" : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contenido por aprobar</CardTitle>
          <CardDescription>
            Revisá y aprobá con un clic, o pedí cambios con feedback puntual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.pendingReview.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No tenés contenido esperando aprobación en este momento.
            </p>
          )}
          {data.pendingReview.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground text-xs capitalize">
                  {item.network.replace(/_/g, " ")}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/client/calendario?item=${item.id}`}>Revisar</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Publicado hasta ahora: <span className="tabular-nums font-medium text-foreground">{publicado}</span> piezas
      </p>
    </div>
  );
}
