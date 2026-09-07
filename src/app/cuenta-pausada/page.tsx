import { PauseCircle, XCircle, ShieldAlert } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutPageButton } from "@/components/shared/logout-page-button";
import { getT } from "@/lib/i18n/dictionary";

const STATUS_META = {
  paused: { icon: PauseCircle, titleKey: "titlePaused", descKey: "descriptionPaused" },
  churned: { icon: XCircle, titleKey: "titleChurned", descKey: "descriptionChurned" },
} as const;

/**
 * Página a la que redirige `/client/layout.tsx` cuando el admin marcó al
 * cliente logueado como Pausado o Perdido (ver ClientStatusMenu en la ficha
 * admin). Vive fuera de `/client/*` a propósito: si estuviera adentro, el
 * propio layout la volvería a interceptar y quedaría en loop de redirects.
 * El acceso real ya está cortado por RLS (`client_has_access()`, ver
 * 0044_block_inactive_client_access.sql) — esto es solo la explicación.
 */
export default async function CuentaPausadaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const profile = await getCurrentProfile();
  const t = getT(profile?.language);
  const { status } = await searchParams;
  const meta = status === "paused" || status === "churned" ? STATUS_META[status] : null;
  const Icon = meta?.icon ?? ShieldAlert;

  const title = meta
    ? t(`pages.cuentaPausada.${meta.titleKey}`, meta.titleKey === "titlePaused" ? "Tu cuenta está pausada" : "Tu cuenta ya no está activa")
    : t("pages.cuentaPausada.titleGeneric", "Tu cuenta no tiene acceso al portal");
  const description = meta
    ? t(
        `pages.cuentaPausada.${meta.descKey}`,
        meta.descKey === "descriptionPaused"
          ? "El acceso a tu portal está temporalmente pausado. Contactá a la agencia para reactivarlo."
          : "Esta cuenta dejó de estar activa en la agencia. Si creés que es un error, contactá a la agencia."
      )
    : t("pages.cuentaPausada.descriptionGeneric", "Contactá a la agencia si creés que es un error.");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4 text-center">
      <Icon className="text-muted-foreground size-10" strokeWidth={1.5} />
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      <LogoutPageButton />
    </div>
  );
}
