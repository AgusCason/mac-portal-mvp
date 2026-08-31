import Link from "next/link";
import {
  Eye,
  FileSignature,
  Sparkles,
  MessageCircle,
  CalendarDays,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AvatarUploadDialog } from "@/components/shared/avatar-upload-dialog";
import { getT } from "@/lib/i18n/dictionary";
import type { ClientDashboardData } from "@/lib/queries/dashboard";
import type { Profile } from "@/types/database";
import { formatDate } from "@/lib/utils";

/** Vista del dashboard para el portal de Cliente (marca / creador). */
export function ClientDashboard({
  data,
  profile,
}: {
  data: ClientDashboardData;
  profile: Profile;
}) {
  const t = getT(profile.language);

  const ACCOUNT_STATUS_META = {
    active: { label: t("components.dashboard.accountStatusActive", "Al día"), variant: "success" as const },
    paused: { label: t("components.dashboard.accountStatusPaused", "Pausada"), variant: "warning" as const },
    churned: { label: t("components.dashboard.accountStatusChurned", "Dada de baja"), variant: "destructive" as const },
  };

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
              {t("components.dashboard.greeting", "Hola,")} {data.client?.brand_name ?? data.client?.name ?? ""}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("components.dashboard.clientSummary", "Así viene tu contenido este mes.")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.planName && <Badge variant="info">{t("components.dashboard.planPrefix", "Plan")} {data.planName}</Badge>}
          {accountStatus && <Badge variant={accountStatus.variant}>{accountStatus.label}</Badge>}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {data.monthlyQuota
                  ? `${data.deliveredThisMonth}/${data.monthlyQuota} ${t("components.dashboard.videosDeliveredOf", "videos entregados")}`
                  : `${data.deliveredThisMonth} ${t("components.dashboard.videosDeliveredThisMonth", "videos entregados este mes")}`}
              </span>
              {quotaPct != null && (
                <span className="text-muted-foreground tabular-nums">{quotaPct}%</span>
              )}
            </div>
            {quotaPct != null && <Progress value={quotaPct} />}
          </div>
          {data.nextCutoffDate && (
            <div className="text-muted-foreground shrink-0 text-xs sm:text-right">
              {t("components.dashboard.nextBillingCutoff", "Próximo corte de facturación")}
              <p className="text-foreground text-sm font-medium tabular-nums">
                {formatDate(data.nextCutoffDate)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label={t("components.dashboard.kpiWaitingApproval", "Esperando tu aprobación")}
          value={data.pendingReview.length}
          icon={Eye}
          tone="info"
        />
        <KpiCard
          label={t("components.dashboard.kpiApprovedReady", "Aprobado / listo")}
          value={aprobado}
          icon={Sparkles}
          tone="primary"
        />
        <KpiCard
          label={t("components.dashboard.kpiPendingContracts", "Contratos pendientes")}
          value={data.pendingContracts}
          icon={FileSignature}
          tone="warning"
          hint={data.pendingContracts > 0 ? t("components.dashboard.kpiPendingContractsHint", "Requieren tu firma") : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t("components.dashboard.pendingReviewTitle", "Contenido por aprobar")}</CardTitle>
            <CardDescription>
              {t("components.dashboard.pendingReviewDesc", "Revisá y aprobá con un clic, o pedí cambios con feedback puntual.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.pendingReview.length === 0 && (
              <p className="text-muted-foreground text-sm">
                {t("components.dashboard.noPendingReview", "No tenés contenido esperando aprobación en este momento.")}
              </p>
            )}
            {data.pendingReview.map((item) => (
              <Link
                key={item.id}
                href={`/client/calendario?item=${item.id}`}
                className="hover:bg-accent -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors duration-150"
              >
                <div className="bg-info/15 text-info flex size-9 shrink-0 items-center justify-center rounded-full">
                  <ImageIcon className="size-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-muted-foreground truncate text-xs capitalize">
                    {item.network.replace(/_/g, " ")}
                  </p>
                </div>
                <Badge variant="info" className="shrink-0">
                  {t("components.dashboard.review", "Revisar")}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {t("components.dashboard.quickAccessTitle", "Accesos rápidos")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Link
                href="/client/calendario"
                className="hover:bg-accent -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors duration-150"
              >
                <CalendarDays className="text-muted-foreground size-4 shrink-0" strokeWidth={1.75} />
                <span className="flex-1">
                  {t("components.dashboard.quickAccessCalendar", "Ver calendario de contenido")}
                </span>
                <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
              </Link>
              <Link
                href="/client/chat"
                className="hover:bg-accent -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors duration-150"
              >
                <MessageCircle className="text-muted-foreground size-4 shrink-0" strokeWidth={1.75} />
                <span className="flex-1">
                  {t("components.dashboard.quickAccessChat", "Hablar con la agencia")}
                </span>
                <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/10">
            <CardContent className="space-y-2 pt-6">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary size-4" strokeWidth={1.75} />
                <p className="text-sm font-semibold">
                  {t("components.dashboard.helpTitle", "¿Necesitás ayuda?")}
                </p>
              </div>
              <p className="text-foreground/80 text-xs leading-relaxed">
                {t(
                  "components.dashboard.helpBody",
                  "Tocá el ícono ✦ abajo a la derecha para preguntarle a MAX, tu asistente del portal, cómo usar cualquier sección."
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        {t("components.dashboard.publishedSoFar", "Publicado hasta ahora:")}{" "}
        <span className="tabular-nums font-medium text-foreground">{publicado}</span> {t("components.dashboard.pieces", "piezas")}
      </p>
    </div>
  );
}
