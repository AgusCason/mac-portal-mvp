import { Camera, Music2, PlaySquare, Radar, Users, Eye, Zap, CircleCheck, CircleAlert } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getSocialAccountsOverview } from "@/lib/queries/social";
import { getClients } from "@/lib/queries/clients";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

// lucide-react v1 no incluye íconos de marca (Instagram/YouTube) — usamos genéricos.
const PLATFORM_ICON = { instagram: Camera, tiktok: Music2, youtube: PlaySquare } as const;

/**
 * Códigos que puede mandar /api/oauth/meta/callback en `?instagramError=` —
 * traducidos acá en vez de mostrar el código crudo, para que el admin
 * entienda qué pasó sin tener que leer los logs del servidor. `t` se recibe
 * como parámetro (en vez de importar `getT` acá) para no duplicar la
 * resolución de idioma del componente.
 */
function instagramErrorMessage(code: string, t: (key: string, fallback: string) => string): string {
  switch (code) {
    case "denied":
      return t("pages.redes.errorDenied", "Cancelaste la conexión con Meta — no se conectó nada.");
    case "invalid_client":
      return t("pages.redes.errorInvalidClient", "No se encontró el cliente al que ibas a conectarle la cuenta.");
    case "exchange_failed":
      return t("pages.redes.errorExchangeFailed", "Meta rechazó el intercambio de credenciales. Probá de nuevo.");
    case "fetch_pages_failed":
      return t("pages.redes.errorFetchPagesFailed", "No se pudieron leer tus páginas de Facebook.");
    case "no_instagram_account":
      return t(
        "pages.redes.errorNoInstagramAccount",
        "Ninguna de tus páginas de Facebook tiene una cuenta de Instagram profesional vinculada."
      );
    case "save_failed":
      return t(
        "pages.redes.errorSaveFailed",
        "Se conectó con Meta pero no se pudo guardar la cuenta. Probá de nuevo."
      );
    default:
      return t("pages.redes.errorInvalidRequest", "Meta no mandó los datos esperados. Probá de nuevo.");
  }
}

export default async function AdminRedesPage({
  searchParams,
}: {
  searchParams: Promise<{ instagramConnected?: string; instagramError?: string }>;
}) {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const { instagramConnected, instagramError } = await searchParams;
  const accounts = await getSocialAccountsOverview();

  // Antes esta página armaba una tarjeta por CUENTA conectada — un cliente
  // recién creado, sin Instagram/TikTok/YouTube todavía, no tenía ninguna
  // fila en `social_accounts` y por lo tanto no aparecía acá ni una sola
  // tarjeta, como si no existiera. `getSocialAccountsOverview` sigue
  // devolviendo solo cuentas reales (la usa también `getSocialMediaOverview`
  // para contar conexiones — no hay que tocarle la forma), así que la lista
  // completa de clientes se trae acá aparte y se resta contra los que ya
  // tienen alguna cuenta, para renderizar una tarjeta placeholder por cada
  // cliente que todavía no conectó nada.
  const clients = await getClients();
  const connectedClientIds = new Set(accounts.map((a) => a.client_id));
  const clientsWithoutAccounts = clients.filter((c) => !connectedClientIds.has(c.id));

  const withMetrics = accounts.filter((a) => a.latest !== null);
  const totalReach = withMetrics.reduce((sum, a) => sum + (a.latest?.reach ?? 0), 0);
  const totalFollowers = withMetrics.reduce((sum, a) => sum + (a.latest?.followers ?? 0), 0);
  const avgEngagement =
    withMetrics.length > 0
      ? withMetrics.reduce((sum, a) => sum + Number(a.latest?.engagement_rate ?? 0), 0) / withMetrics.length
      : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("pages.redes.title", "Redes sociales")}
        description={t(
          "pages.redes.description",
          "Cuentas conectadas y métricas clave por cliente (Meta Graph API, TikTok, YouTube)."
        )}
        actions={<Badge variant="secondary">{t("pages.redes.badge", "Fase avanzada")}</Badge>}
      />

      {instagramConnected && (
        <Card className="glass-card border-primary/30">
          <CardContent className="flex items-center gap-3 py-3.5 text-sm">
            <CircleCheck className="text-primary size-4.5 shrink-0" />
            <span>
              {t("pages.redes.connectedPrefix", "Instagram conectado:")}{" "}
              <strong>@{instagramConnected}</strong>
            </span>
          </CardContent>
        </Card>
      )}
      {instagramError && (
        <Card className="glass-card border-destructive/30">
          <CardContent className="flex items-center gap-3 py-3.5 text-sm">
            <CircleAlert className="text-destructive size-4.5 shrink-0" />
            <span>{instagramErrorMessage(instagramError, t)}</span>
          </CardContent>
        </Card>
      )}

      {clients.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Radar className="text-muted-foreground size-8" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium">{t("pages.redes.noClients", "Todavía no cargaste ningún cliente")}</p>
              <p className="text-muted-foreground max-w-sm text-sm">
                {t(
                  "pages.redes.noClientsHint",
                  "Los clientes que crees en Cuentas van a aparecer acá — con o sin cuentas sociales conectadas."
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {withMetrics.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="glass-card flex-row items-center gap-3.5 p-4">
            <div className="icon-chip">
              <Eye className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium uppercase">
                {t("pages.redes.totalReach", "Alcance total")}
              </p>
              <p className="text-xl font-semibold tabular-nums">{totalReach.toLocaleString("es-AR")}</p>
            </div>
          </Card>
          <Card className="glass-card flex-row items-center gap-3.5 p-4">
            <div className="icon-chip">
              <Users className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium uppercase">
                {t("pages.redes.totalFollowers", "Seguidores totales")}
              </p>
              <p className="text-xl font-semibold tabular-nums">{totalFollowers.toLocaleString("es-AR")}</p>
            </div>
          </Card>
          <Card className="glass-card flex-row items-center gap-3.5 p-4">
            <div className="icon-chip">
              <Zap className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium uppercase">
                {t("pages.redes.avgEngagement", "Engagement promedio")}
              </p>
              <p className="text-xl font-semibold tabular-nums">{avgEngagement.toFixed(1)}%</p>
            </div>
          </Card>
        </div>
      )}

      {(accounts.length > 0 || clientsWithoutAccounts.length > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const Icon = PLATFORM_ICON[acc.platform];
            return (
              <Card key={acc.id} className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className="size-4" /> {acc.display_name ?? acc.external_account_id}
                  </CardTitle>
                  <CardDescription>{acc.client_name}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">{t("pages.redes.reach", "Alcance")}</p>
                    <p className="tabular-nums font-medium">{acc.latest?.reach ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">{t("pages.redes.engagement", "Engagement")}</p>
                    <p className="tabular-nums font-medium">
                      {acc.latest ? `${acc.latest.engagement_rate}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">{t("pages.redes.followers", "Seguidores")}</p>
                    <p className="tabular-nums font-medium">{acc.latest?.followers ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">{t("pages.redes.plays", "Reproducciones")}</p>
                    <p className="tabular-nums font-medium">{acc.latest?.plays ?? "—"}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Placeholder por cliente sin ninguna cuenta social conectada todavía
              — antes estos clientes simplemente no aparecían en esta página. */}
          {clientsWithoutAccounts.map((client) => (
            <Card key={client.id} className="glass-card border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Radar className="text-muted-foreground size-4" strokeWidth={1.75} />
                  {client.brand_name ?? client.name}
                </CardTitle>
                <CardDescription>
                  {t("pages.redes.noAccountsForClient", "Sin cuentas conectadas todavía")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" variant="outline">
                  <a href={`/api/oauth/meta/connect?clientId=${client.id}`}>
                    <Camera /> {t("pages.redes.connectInstagram", "Conectar Instagram")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
