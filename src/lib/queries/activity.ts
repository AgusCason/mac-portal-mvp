import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ActivityEvent } from "@/types/database";

export interface ActivityEventWithClient extends ActivityEvent {
  client_name: string | null;
}

/**
 * Feed de actividad del workspace (equivalente a Management > Actividad de
 * MB Suite, y a lo que muestra el panel deslizante "Actividad" del navbar).
 * RLS ya acota el resultado según quién pregunta — ver policies en
 * supabase/migrations/0009_activity_notifications.sql.
 */
export async function getRecentActivity(limit = 30): Promise<ActivityEventWithClient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentActivity]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const { clients, ...rest } = row as ActivityEvent & { clients: { name: string } | null };
    return { ...rest, client_name: clients?.name ?? null };
  });
}
