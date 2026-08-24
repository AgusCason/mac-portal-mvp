import Link from "next/link";
import { CalendarClock, Radar, Compass, Sparkles, Swords, LayoutGrid } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getSocialMediaOverview } from "@/lib/queries/social-media";
import { STATUS_META } from "@/components/dashboard/content-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const SHORTCUTS = [
  { label: "Insights", href: "/admin/redes", icon: Radar, description: "Métricas y monitoreo por cuenta" },
  { label: "Planner", href: "/admin/social-media/planner", icon: Compass, description: "Calendario y kanban de piezas" },
  {
    label: "Content Studio",
    href: "/admin/social-media/content-studio",
    icon: Sparkles,
    description: "Banco de ideas, guiones y captions",
  },
  {
    label: "Brand Voice",
    href: "/admin/social-media/brand-voice",
    icon: LayoutGrid,
    description: "Tono de marca por cuenta",
  },
  { label: "Competidores", href: "/admin/social-media/competidores", icon: Swords, description: "Benchmark de la competencia" },
];

/**
 * Social Media > Overview — resumen ejecutivo del módulo, equivalente a
 * `/demo-agency/social-media/overview` de MB Suite.
 */
export default async function AdminSocialMediaPage() {
  await requireAdmin();
  const overview = await getSocialMediaOverview();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Social Media</h1>
        <p className="text-muted-foreground text-sm">Resumen de piezas, cuentas conectadas y próximas publicaciones.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase">Piezas totales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{overview.totalPieces}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase">Cuentas conectadas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{overview.connectedAccounts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase">Programadas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{overview.byStatus["programado"] ?? 0}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarClock className="size-4" /> Próximas publicaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview.scheduledPieces.length === 0 && (
              <p className="text-muted-foreground text-sm">No hay piezas programadas.</p>
            )}
            {overview.scheduledPieces.map((item) => (
              <div key={item.id} className="border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-muted-foreground truncate text-xs">{item.client_name}</p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">{formatDate(item.scheduled_at!)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Piezas por estado</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(overview.byStatus).map(([status, count]) => {
              const meta = STATUS_META[status as keyof typeof STATUS_META];
              return (
                <Badge key={status} variant={meta?.variant ?? "secondary"}>
                  {meta?.label ?? status}: {count}
                </Badge>
              );
            })}
            {Object.keys(overview.byStatus).length === 0 && (
              <p className="text-muted-foreground text-sm">Todavía no hay piezas cargadas.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="border-border hover:bg-accent/50 flex items-center gap-3 rounded-xl border p-4 transition-colors duration-150"
          >
            <s.icon className="text-muted-foreground size-5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-muted-foreground truncate text-xs">{s.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
