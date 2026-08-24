import { requireRole } from "@/lib/auth";
import { getExplorerRows } from "@/lib/queries/analytics";
import { getSelectableClients } from "@/lib/queries/content";
import { ExplorerFilters } from "@/components/analytics/explorer-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { SocialPlatform } from "@/types/database";

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

/**
 * Analytics > Explorer — equivalente a `/demo-agency/analytics/explorer` de
 * MB Suite: tabla plana y filtrable de todas las métricas diarias cargadas,
 * cruzando cuenta + cliente. Filtros sincronizados con la URL.
 */
export default async function AnalyticsExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; plataforma?: string; dias?: string }>;
}) {
  await requireRole(["admin"]);
  const { cliente, plataforma, dias } = await searchParams;
  const [clients, rows] = await Promise.all([
    getSelectableClients(),
    getExplorerRows({
      clientId: cliente,
      platform: plataforma as SocialPlatform | undefined,
      days: dias ? Number(dias) : undefined,
    }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Explorer</h1>
        <p className="text-muted-foreground text-sm">
          {rows.length} fila{rows.length === 1 ? "" : "s"} de métricas diarias.
        </p>
      </div>

      <ExplorerFilters clients={clients} />

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead className="text-right">Alcance</TableHead>
              <TableHead className="text-right">Impresiones</TableHead>
              <TableHead className="text-right">Engagement</TableHead>
              <TableHead className="text-right">Seguidores</TableHead>
              <TableHead className="text-right">Reproducciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="tabular-nums text-sm">{formatDate(r.metricDate)}</TableCell>
                <TableCell className="text-sm">
                  <p className="font-medium">{r.clientName}</p>
                  {r.accountName && <p className="text-muted-foreground text-xs">{r.accountName}</p>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{PLATFORM_LABEL[r.platform]}</Badge>
                </TableCell>
                <TableCell className="tabular-nums text-right">{r.reach.toLocaleString("es-AR")}</TableCell>
                <TableCell className="tabular-nums text-right">
                  {r.impressions.toLocaleString("es-AR")}
                </TableCell>
                <TableCell className="tabular-nums text-right">{r.engagementRate.toFixed(2)}%</TableCell>
                <TableCell className="tabular-nums text-right">
                  {r.followers.toLocaleString("es-AR")}
                </TableCell>
                <TableCell className="tabular-nums text-right">{r.plays.toLocaleString("es-AR")}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                  No hay métricas cargadas para estos filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
