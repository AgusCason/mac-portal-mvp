import Link from "next/link";
import { Wrench, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getToolsCostOverview } from "@/lib/queries/finance-overview";
import { ToolsCostPanel } from "@/components/finance/tools-cost-panel";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Finanzas de Herramientas — vista de detalle del bloque "Pago
 * Herramientas" del dashboard general. A propósito es una página distinta
 * de `/admin/herramientas`: esa es para accesos y credenciales (qué
 * herramienta, quién tiene el login), esta es para plata (cuánto sale cada
 * una, cuándo vence, alertas) — dos cosas distintas que comparten la misma
 * tabla `agency_tools`, no la misma pantalla.
 */
export default async function AdminFinanzasHerramientasPage() {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);

  const toolsCost = await getToolsCostOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.finanzasHerramientas.title", "Finanzas de Herramientas")}
        description={t(
          "pages.finanzasHerramientas.description",
          "Cuánto sale cada herramienta de la agencia, cuándo vence y alertas de vencimiento próximo — para accesos y credenciales, ver Herramientas."
        )}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/herramientas">
              <Wrench className="size-3.5" />
              {t("pages.finanzasHerramientas.viewAccess", "Ver accesos")} <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        }
      />

      <ToolsCostPanel overview={toolsCost} language={profile.language} limit={50} />
    </div>
  );
}
