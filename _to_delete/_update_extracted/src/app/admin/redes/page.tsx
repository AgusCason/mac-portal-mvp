import { Camera, Music2, PlaySquare, Radar } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getSocialAccountsOverview } from "@/lib/queries/social";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// lucide-react v1 no incluye íconos de marca (Instagram/YouTube) — usamos genéricos.
const PLATFORM_ICON = { instagram: Camera, tiktok: Music2, youtube: PlaySquare } as const;

export default async function AdminRedesPage() {
  await requireRole(["admin"]);
  const accounts = await getSocialAccountsOverview();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Redes sociales</h1>
          <p className="text-muted-foreground text-sm">
            Cuentas conectadas y métricas clave por cliente (Meta Graph API, TikTok, YouTube).
          </p>
        </div>
        <Badge variant="secondary">Fase avanzada</Badge>
      </div>

      {accounts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Radar className="text-muted-foreground size-8" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium">Todavía no conectaste ninguna cuenta</p>
              <p className="text-muted-foreground max-w-sm text-sm">
                Conectá Instagram, TikTok o YouTube desde el detalle de cada cliente
                para ver alcance, reproducciones, engagement y crecimiento de seguidores acá.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <a href="/api/oauth/meta/connect">
                <Camera /> Conectar Instagram
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {accounts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const Icon = PLATFORM_ICON[acc.platform];
            return (
              <Card key={acc.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className="size-4" /> {acc.display_name ?? acc.external_account_id}
                  </CardTitle>
                  <CardDescription>{acc.client_name}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">Alcance</p>
                    <p className="tabular-nums font-medium">{acc.latest?.reach ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">Engagement</p>
                    <p className="tabular-nums font-medium">
                      {acc.latest ? `${acc.latest.engagement_rate}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">Seguidores</p>
                    <p className="tabular-nums font-medium">{acc.latest?.followers ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">Reproducciones</p>
                    <p className="tabular-nums font-medium">{acc.latest?.plays ?? "—"}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
