import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import { getT } from "@/lib/i18n/dictionary";

export default async function NoAutorizadoPage() {
  const profile = await getCurrentProfile();
  const t = getT(profile?.language);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4 text-center">
      <ShieldAlert className="text-destructive size-10" strokeWidth={1.5} />
      <h1 className="text-lg font-semibold">
        {t("pages.noAutorizado.title", "No tenés acceso a esta sección")}
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        {t(
          "pages.noAutorizado.description",
          "Tu cuenta no tiene permisos para ver esta página. Si creés que es un error, contactá a la agencia."
        )}
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard">{t("pages.noAutorizado.backButton", "Volver a mi panel")}</Link>
      </Button>
    </div>
  );
}
