import { requireRole } from "@/lib/auth";
import { totalModulesCount, countModulesByStatus } from "@/lib/modules-catalog";
import { getModuleFlags } from "@/lib/queries/module-flags";
import { ModulosPanel } from "@/components/config/modulos-panel";
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
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("nav.config.modulos", "Módulos")}</h1>
        <p className="text-muted-foreground text-sm">
          {total} módulos · {incluidos} incluidos · {proximamente} próximamente
        </p>
      </div>

      <ModulosPanel flags={flags} />
    </div>
  );
}
