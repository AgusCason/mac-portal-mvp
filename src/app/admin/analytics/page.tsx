import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getAnalyticsOverview } from "@/lib/queries/analytics";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Radar,
  Eye,
  Users,
  TrendingUp,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  LayoutDashboard,
  Compass,
  Send,
  Link2,
} from "lucide-react";
const SHORTCUTS = [
  {
    href: "/admin/redes",
    icon: Radar,
    label: "Monitors",
    description: "Cuentas sociales conectadas y su última métrica cargada.",
  },
  {
    href: "/admin/analytics/dashboards",
    icon: LayoutDashboard,
    label: "Dashboards",
    description: "Vistas armadas por tema: alcance, engagement, crecimiento.",
  },
  {
    href: "/admin/analytics/explorer",
    icon: Compass,
    label: "Explorer",
    description: "Tabla plana y filtrable de todas las métricas cargadas.",
  },
  {
    href: "/admin/reportes",
    icon: FileText,
    label: "Reports",
    description: "Reportes con IA por cliente, borrador o publicados.",
  },
  {
    href: "/admin/analytics/alertas",
    icon: AlertTriangle,
    label: "Alertas",
    description: "Caídas de métricas detectadas automáticamente.",
  },
  {
    href: "/admin/analytics/envios",
    icon: Send,
    label: "Envíos",
    description: "Historial de reportes publicados y enviados a clientes.",
  },
  {
    href: "/admin/analytics/utm-builder",
    icon: Link2,
    label: "UTM Builder",
    description: "Arma URLs de campaña con parámetros UTM.",
  },
];

/**
 * Analytics > Overview — equivalente a `/demo-agency/analytics` de MB Suite:
 * KPIs agregados de toda la agencia (no de un cliente puntual, como sí hace
 * el Módulo de Reportes) + accesos directos a las 7 sub-secciones restantes.
 */
export default async function AdminAnalyticsPage() {
  await requireRole(["admin"]);
  const overview = await getAnalyticsOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Rendimiento agregado de todas las cuentas conectadas de la agencia.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Cuentas conectadas" value={overview.connectedAccounts} icon={Radar} />
        <KpiCard label="Alcance total" value={overview.totalReach.toLocaleString("es-AR")} icon={Eye} />
        <KpiCard label="Seguidores totales" value={overview.totalFollowers.toLocaleString("es-AR")} icon={Users} />
        <KpiCard
          label="Engagement promedio"
          value={`${overview.avgEngagementRate.toFixed(2)}%`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="text-destructive size-4" /> Alertas de métricas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="tabular-nums text-2xl font-semibold">{overview.activeAlerts}</p>
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/analytics/alertas">
                Ver todas <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="text-info size-4" /> Reportes este mes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="tabular-nums text-2xl font-semibold">{overview.reportsThisMonth}</p>
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/reportes">
                Ir a Reports <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Herramientas</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="bg-primary/10 text-primary rounded-lg p-2">
                <s.icon className="size-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-muted-foreground text-xs">{s.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
