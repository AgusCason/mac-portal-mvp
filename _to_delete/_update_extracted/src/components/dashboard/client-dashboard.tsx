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
import { Progress } from "@/components/ui/progress";
import { AvatarUploadDialog } from "@/components/shared/avatar-upload-dialog";
import type { ClientDashboardData } from "@/lib/queries/dashboard";
import type { Profile } from "@/types/database";
import { formatDate } from "@/lib/utils";

const ACCOUNT_STATUS_META = {
  active: { label: "Al día", variant: "success" as const },
  paused: { label: "Pausada", variant: "warning" as const },
  churned: { label: "Dada de baja", variant: "destructive" as const },
};

/** Vista del dashboard para el portal de Cliente (marca / creador). */
export function ClientDashboard({
  data,
  profile,
}: {
  data: ClientDashboardData;
  profile: Profile;
}) {
  const publicado = data.contentByStatus.publicado;
  const aprobado = data.contentByStatus.aprobado;
  const accountStatus = data.client ? ACCOUNT_STATUS_META[data.client.status] : null;
  const quotaPct =
    data.monthlyQuota && data.monthlyQuota > 0
      ? Math.min(100, Math.round((data.deliveredThisMonth / data.monthlyQuota) * 100))
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AvatarUploadDialog
            profileId={profile.id}
            fullName={profile.full_name}
            email={profile.email}
            avatarUrl={profile.avatar_url}
          />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Hola, {data.client?.brand_name ?? data.client?.name ?? ""}
            </h1>
            <p className="text-muted-foreground text-sm">
              Así viene tu contenido este mes.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.planName && <Badge variant="info">Plan {data.planName}</Badge>}
          {accountStatus && <Badge variant={accountStatus.variant}>{accountStatus.label}</Badge>}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {data.monthlyQuota
                  ? `${data.deliveredThisMonth}/${data.monthlyQuota} videos entregados`
                  : `${data.deliveredThisMonth} videos entregados este mes`}
              </span>
              {quotaPct != null && (
                <span className="text-muted-foreground tabular-nums">{quotaPct}%</span>
              )}
            </div>
            {quotaPct != null && <Progress value={quotaPct} />}
          </div>
          {data.nextCutoffDate && (
            <div className="text-muted-foreground shrink-0 text-xs sm:text-right">
              Próximo corte de facturación
              <p className="text-foreground text-sm font-medium tabular-nums">
                {formatDate(data.nextCutoffDate)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
