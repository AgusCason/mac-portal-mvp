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
export async function getTasks(filters: TaskFilters = {}): Promise<TaskWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("*, clients(name), profiles!tasks_assigned_to_fkey(full_name)")
    .order("due_date", { ascending: true, nullsFirst: false });

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
