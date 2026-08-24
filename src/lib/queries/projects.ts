import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectItem } from "@/types/database";

export interface ProjectWithRelations extends Project {
  client_name: string | null;
  itemCount: number;
}

/** Management > Proyectos — lista de proyectos con cuenta y cantidad de items. */
export async function getProjects(): Promise<ProjectWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(name), project_items(id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getProjects]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const typed = row as unknown as Project & {
      clients: { name: string } | null;
      project_items: { id: string }[] | null;
    };
    const { clients, project_items, ...rest } = typed;
    return {
      ...rest,
      client_name: clients?.name ?? null,
      itemCount: project_items?.length ?? 0,
    };
  });
}

export interface ProjectItemWithAssignee extends ProjectItem {
  assignee_name: string | null;
}

export interface ProjectDetail {
  project: ProjectWithRelations;
  items: ProjectItemWithAssignee[];
}

/** Ficha de un proyecto — el tablero kanban de /admin/proyectos/[id]. */
export async function getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  const supabase = await createClient();

  const [{ data: project }, { data: items }] = await Promise.all([
    supabase.from("projects").select("*, clients(name), project_items(id)").eq("id", projectId).single(),
    supabase
      .from("project_items")
      .select("*, profiles(full_name)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
  ]);

  if (!project) return null;

  const typedProject = project as unknown as Project & {
    clients: { name: string } | null;
    project_items: { id: string }[] | null;
  };

  return {
    project: {
      ...typedProject,
      client_name: typedProject.clients?.name ?? null,
      itemCount: typedProject.project_items?.length ?? 0,
    },
    items: (items ?? []).map((row) => {
      const typed = row as unknown as ProjectItem & { profiles: { full_name: string } | null };
      const { profiles, ...rest } = typed;
      return { ...rest, assignee_name: profiles?.full_name ?? null };
    }),
  };
}
