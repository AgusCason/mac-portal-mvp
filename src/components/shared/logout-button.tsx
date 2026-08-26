"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/i18n/locale-context";

export function LogoutMenuItem() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
      <LogOut />
      {t("common.logout", "Cerrar sesión")}
    </DropdownMenuItem>
  );
}
