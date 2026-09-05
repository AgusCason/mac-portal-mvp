import { requireAdmin } from "@/lib/auth";
import { getCompetitors } from "@/lib/queries/competitors";
import { getSelectableClients } from "@/lib/queries/content";
import { CompetitorsView } from "@/components/competitors/competitors-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Social Media > Competidores — benchmark de la competencia, equivalente a
 * `/demo-agency/social-media/competidores` (tabs Perfiles/Benchmark).
 */
export default async function AdminCompetidoresPage() {
  const profile = await requireAdmin();
  const t = getT(profile.language);

  const [competitors, clients] = await Promise.all([getCompetitors(), getSelectableClients()]);

  const topByFollowers = [...competitors]
    .filter((c) => (c.followers_count ?? 0) > 0)
    .sort((a, b) => (b.followers_count ?? 0) - (a.followers_count ?? 0))
    .slice(0, 6);
  const maxFollowers = Math.max(1, ...topByFollowers.map((c) => c.followers_count ?? 0));

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.socialMedia.competidores", "Competidores")}
        description={t("pages.socialCompetidores.description", "Perfiles de la competencia y benchmark de métricas públicas.")}
      />

      {topByFollowers.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="icon-chip">
              <Users className="size-4" strokeWidth={1.75} />
            </div>
            <CardTitle>{t("pages.socialCompetidores.byFollowersTitle", "Competidores por seguidores")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {topByFollowers.map((c) => {
              const widthPct = Math.max(4, Math.round(((c.followers_count ?? 0) / maxFollowers) * 100));
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-[11.5px] font-semibold">{c.name}</span>
                  <div className="bg-accent/60 h-2 flex-1 overflow-hidden rounded-full">
                    <span className="bg-primary/80 block h-full rounded-full" style={{ width: `${widthPct}%` }} />
                  </div>
                  <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums">
                    {(c.followers_count ?? 0).toLocaleString("es-AR")}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <CompetitorsView competitors={competitors} clients={clients} />
    </div>
  );
}
