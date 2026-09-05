import { requireRole } from "@/lib/auth";
import { totalModulesCount, countModulesByStatus } from "@/lib/modules-catalog";
import { getModuleFlags } from "@/lib/queries/module-flags";
import { ModulosPanel } from "@/components/config/modulos-panel";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/shared/mini-charts";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Configuración > Módulos — Fase F2: además del índice maestro (Fase 2.4),
 * ahora tiene switches reales de "Activo" / "Visible Editor" / "Visible
 * Cliente" por módulo, respaldados por module_flags. Gatea de verdad el
 * sidebar (app-shell.tsx) y el acceso por URL (proxy.ts).
 */
export default async function AdminModulosPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const flags = await getModuleFlags();
  const total = totalModulesCount();
  const incluidos = countModulesByStatus("incluido");
  const proximamente = countModulesByStatus("proximamente");

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.config.modulos", "Módulos")}
        description={
          <>
            {total} {t("components.config.totalModulesSummary", "módulos")} · {incluidos}{" "}
            {t("components.config.includedSummary", "incluidos")} · {proximamente}{" "}
            {t("components.config.comingSoonSummary", "próximamente")}
          </>
        }
      />

      {total > 0 && (
        <Card className="flex-row items-center gap-3.5 p-4">
          <ProgressRing value={incluidos} max={total} color="var(--success)" />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">
              {t("pages.modulos.includedRatioTitle", "Módulos incluidos sobre el total")}
            </p>
            <p className="text-muted-foreground text-xs">
              {incluidos} {t("pages.modulos.ofTotal", "de")} {total}
            </p>
          </div>
        </Card>
      )}

      <ModulosPanel flags={flags} />
    </div>
  );
}
