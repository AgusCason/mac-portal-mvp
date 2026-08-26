import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Task, TaskStatus } from "@/types/database";

export interface TaskWithRelations extends Task {
  client_name: string | null;
  assignee_name: string | null;
}

export interface TaskFilters {
  status?: TaskStatus;
  onlyPending?: boolean;
}

/**
 * Management > Tareas — equivalente a "Tareas del Workspace" de MB Suite.
 * Trae el nombre de cuenta y de responsable ya resueltos para no repetir el
 * join en cada componente que la use.
 */
export async function getTasks(
  filters: TaskFilters = {},
  limit = 300
): Promise<TaskWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("*, clients(name), profiles!tasks_assigned_to_fkey(full_name)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.onlyPending) query = query.in("status", ["pendiente", "en_curso"]);

  const { data, error } = await query;
  if (error) {
    console.error("[getTasks]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const typed = row as unknown as Task & {
      clients: { name: string } | null;
      profiles: { full_name: string } | null;
    };
    const { clients, profiles, ...rest } = typed;
    return {
      ...rest,
      client_name: clients?.name ?? null,
      assignee_name: profiles?.full_name ?? null,
    };
  });
}

/**
 * Mis tareas — vista del editor (`/editor/tareas`). A diferencia de
 * `getTasks` (admin, ve todo vía "tasks_admin_all"), acá RLS acota solo a
 * lo asignado a `editorId` (policy "tasks_editor_select_own" en
 * 0023_editor_tasks_rls.sql) — el filtro por `assigned_to` de abajo es
 * además defensa en profundidad, no el único guard.
 */
export async function getMyTasks(
  editorId: string,
  filters: TaskFilters = {},
  limit = 300
): Promise<TaskWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("*, clients(name), profiles!tasks_assigned_to_fkey(full_name)")
    .eq("assigned_to", editorId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.onlyPending) query = query.in("status", ["pendiente", "en_curso"]);

  const { data, error } = await query;
  if (error) {
    console.error("[getMyTasks]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const typed = row as unknown as Task & {
      clients: { name: string } | null;
      profiles: { full_name: string } | null;
    };
    const { clients, profiles, ...rest } = typed;
    return {
      ...rest,
      client_name: clients?.name ?? null,
      assignee_name: profiles?.full_name ?? null,
    };
  });
}
