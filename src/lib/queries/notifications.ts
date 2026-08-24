import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AppNotification } from "@/types/database";

/**
 * Notificaciones del usuario logueado (RLS: profile_id = auth.uid(), ver
 * migración 0009). Alimenta el panel deslizante "Notificaciones" del navbar.
 */
export async function getNotifications(limit = 30): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getNotifications]", error.message);
    return [];
  }
  return data ?? [];
}

/** Cantidad de notificaciones sin leer — para el badge sobre la campana. */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    console.error("[getUnreadNotificationCount]", error.message);
    return 0;
  }
  return count ?? 0;
}
