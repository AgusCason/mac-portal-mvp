import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { WebProject, WebProjectAsset } from "@/types/database";

export interface WebProjectWithClient extends WebProject {
  client_name: string;
  assetCount: number;
}

/**
 * Lista proyectos de Sitios Web. RLS acota a admin (todos) o al cliente
 * dueño (los suyos) — mismo `clientId?` opcional que `getContracts`.
 */
export async function getWebProjects(clientId?: string, limit = 300): Promise<WebProjectWithClient[]> {
  const supabase = await createClient();
  let query = supabase
    .from("web_projects")
    .select("*, clients(name), web_project_assets(id)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) {
    console.error("[getWebProjects]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const typed = row as unknown as WebProject & {
      clients: { name: string } | null;
      web_project_assets: { id: string }[] | null;
    };
    const { clients, web_project_assets, ...rest } = typed;
    return {
      ...rest,
      client_name: clients?.name ?? "—",
      assetCount: web_project_assets?.length ?? 0,
    };
  });
}

export interface WebProjectDetail {
  project: WebProjectWithClient;
  assets: WebProjectAsset[];
}

/** Ficha de un proyecto de Sitios Web (detalle admin + vista de avance del cliente). */
export async function getWebProjectDetail(projectId: string): Promise<WebProjectDetail | null> {
  const supabase = await createClient();

  const [{ data: project }, { data: assets }] = await Promise.all([
    supabase
      .from("web_projects")
      .select("*, clients(name), web_project_assets(id)")
      .eq("id", projectId)
      .single(),
    supabase
      .from("web_project_assets")
      .select("*")
      .eq("web_project_id", projectId)
      .order("created_at", { ascending: true }),
  ]);

  if (!project) return null;

  const typedProject = project as unknown as WebProject & {
    clients: { name: string } | null;
    web_project_assets: { id: string }[] | null;
  };

  return {
    project: {
      ...typedProject,
      client_name: typedProject.clients?.name ?? "—",
      assetCount: typedProject.web_project_assets?.length ?? 0,
    },
    assets: (assets ?? []) as WebProjectAsset[],
  };
}
