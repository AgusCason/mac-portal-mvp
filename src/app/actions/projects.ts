"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/types/database";

const projectSchema = z.object({
  title: z.string().min(2, "El título es obligatorio"),
  description: z.string().optional(),
  clientId: z.string().uuid().optional().or(z.literal("")),
});

export type CreateProjectResult = { ok: true; projectId: string } | { ok: false; error: string };

/** Crea un proyecto nuevo (arranca en "por_iniciar"). */
export async function createProjectAction(formData: FormData): Promise<CreateProjectResult> {
  const admin = await requireAdmin();
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    clientId: formData.get("clientId") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || "",
      client_id: parsed.data.clientId || null,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "No se pudo crear el proyecto" };
  revalidatePath("/admin/proyectos");
  return { ok: true, projectId: data.id };
}

/** Cambia el estado general del proyecto (independiente del tablero de items). */
export async function updateProjectStatusAction(projectId: string, status: ProjectStatus) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("projects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/proyectos");
  revalidatePath(`/admin/proyectos/${projectId}`);
  return { ok: true };
}

/** Elimina un proyecto (cascada a sus items). */
export async function deleteProjectAction(projectId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/proyectos");
  return { ok: true };
}

const itemSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  assignedTo: z.string().uuid().optional().or(z.literal("")),
  dueDate: z.string().optional(),
});

/** Agrega un item (card) al tablero de un proyecto. */
export async function createProjectItemAction(projectId: string, formData: FormData) {
  await requireAdmin();
  const parsed = itemSchema.safeParse({
    title: formData.get("title"),
    assignedTo: formData.get("assignedTo") ?? "",
    dueDate: formData.get("dueDate") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("project_items").insert({
    project_id: projectId,
    title: parsed.data.title,
    assigned_to: parsed.data.assignedTo || null,
    due_date: parsed.data.dueDate || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/proyectos/${projectId}`);
  return { ok: true };
}

/** Mueve un item entre columnas del tablero (drag and drop). */
export async function updateProjectItemStatusAction(
  itemId: string,
  projectId: string,
  status: ProjectStatus
) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("project_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/proyectos/${projectId}`);
  return { ok: true };
}

/** Elimina un item del tablero. */
export async function deleteProjectItemAction(itemId: string, projectId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("project_items").delete().eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/proyectos/${projectId}`);
  return { ok: true };
}
