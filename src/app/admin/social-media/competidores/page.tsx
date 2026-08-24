import { requireAdmin } from "@/lib/auth";
import { getCompetitors } from "@/lib/queries/competitors";
import { getSelectableClients } from "@/lib/queries/content";
import { CompetitorsView } from "@/components/competitors/competitors-view";

/**
 * Social Media > Competidores — benchmark de la competencia, equivalente a
 * `/demo-agency/social-media/competidores` (tabs Perfiles/Benchmark).
 */
export default async function AdminCompetidoresPage() {
  await requireAdmin();

  const [competitors, clients] = await Promise.all([getCompetitors(), getSelectableClients()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Competidores</h1>
        <p className="text-muted-foreground text-sm">Perfiles de la competencia y benchmark de métricas públicas.</p>
      </div>
      <CompetitorsView competitors={competitors} clients={clients} />
    </div>
  );
}
