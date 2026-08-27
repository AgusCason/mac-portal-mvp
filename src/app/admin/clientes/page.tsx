import { requireRole } from "@/lib/auth";
import { getAccountsOverview } from "@/lib/queries/clients";
import { getContacts } from "@/lib/queries/contacts";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { NewClientDialog } from "@/components/clients/new-client-dialog";
import { AccountsView } from "@/components/clients/accounts-view";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Cuentas — Fase de la adaptación "estilo MB Suite" que transforma la vieja
 * sección "Clientes" en el equivalente de `/demo-agency/accounts`: mismos
 * datos reales de Supabase (`clients`), presentados como tarjetas con logo,
 * suscripción, equipo asignado y plataformas conectadas, con favoritos,
 * buscador y toggle grilla/tabla.
 */
export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ fromContact?: string }>;
}) {
  const admin = await requireRole(["admin"]);
  const t = getT(admin.language);
  const { fromContact } = await searchParams;
  const [accounts, supabase, contacts] = await Promise.all([
    getAccountsOverview(admin.id),
    createSupabaseServerClient(),
    getContacts(),
  ]);
  const { data: plans } = await supabase.from("plans").select("*").order("price_monthly");

  const activeCount = accounts.filter((a) => a.status === "active").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("pages.clientes.title", "Cuentas")}
            <span className="text-muted-foreground ml-2 text-sm font-normal align-middle">
              · {activeCount}{" "}
              {activeCount === 1
                ? t("pages.clientes.activeSingular", "activa")
                : t("pages.clientes.activePlural", "activas")}{" "}
              {t("pages.clientes.ofTotal", "de")} {accounts.length}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">{t("pages.clientes.description", "Gestiona tus clientes y proyectos.")}</p>
        </div>
        <NewClientDialog plans={plans ?? []} contacts={contacts} initialContactId={fromContact} />
      </div>

      <AccountsView accounts={accounts} />
    </div>
  );
}
