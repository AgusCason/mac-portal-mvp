"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Botón de "Cerrar sesión" standalone (no dentro de un DropdownMenu) — para
 * páginas fuera del AppShell normal, como /cuenta-pausada, donde no tiene
 * sentido ofrecer "volver a mi panel" (redirigiría de nuevo acá mismo).
 */
export function LogoutPageButton() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="size-3.5" />
      {t("common.logout", "Cerrar sesión")}
    </Button>
  );
}
