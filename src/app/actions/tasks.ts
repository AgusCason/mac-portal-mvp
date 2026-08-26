"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { TaskPriority, TaskStatus } from "@/types/database";

const TASKS_PATH = "/admin/tareas";
const EDITOR_TASKS_PATH = "/editor/tareas";

const taskSchema = z.object({
  title: z.string().min(2, "El título es obligatorio"),
  description: z.string().optional(),
  priority: z.enum(["baja", "media", "alta", "urgente"]),
  dueDate: z.string().optional(),
  clientId: z.string().uuid().optional().or(z.literal("")),
  assignedTo: z.string().uuid().optional().or(z.literal("")),
});

function parseTaskForm(formData: FormData) {
  const rawClientId = (formData.get("clientId") as string) || "";
  const rawAssignedTo = (formData.get("assignedTo") as string) || "";
  return taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    priority: formData.get("priority") || "media",
    dueDate: formData.get("dueDate") ?? "",
    clientId: rawClientId === "none" ? "" : rawClientId,
    assignedTo: rawAssignedTo === "none" ? "" : rawAssignedTo,
  });
}

/** Crea una tarea nueva. */
export async function createTaskAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = parseTaskForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { title, description, priority, dueDate, clientId, assignedTo } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").insert({
    title,
    description: description || "",
    priority: priority as TaskPriority,
    due_date: dueDate || null,
    client_id: clientId || null,
    assigned_to: assignedTo || null,
    created_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(TASKS_PATH);
  return { ok: true };
}

/** Edita una tarea existente. */
export async function updateTaskAction(taskId: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseTaskForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { title, description, priority, dueDate, clientId, assignedTo } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description: description || "",
      priority: priority as TaskPriority,
      due_date: dueDate || null,
      client_id: clientId || null,
      assigned_to: assignedTo || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(TASKS_PATH);
  return { ok: true };
}

/** Cambia el estado de una tarea (usado por el checkbox rápido y el select de estado). */
export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(TASKS_PATH);
  return { ok: true };
}

/**
 * Cambia el estado de UNA de sus propias tareas — versión para /editor/tareas.
 * La policy "tasks_editor_update_own" (0023_editor_tasks_rls.sql) ya lo exige
 * a nivel de base, pero se valida también acá — defensa en profundidad, y
 * además así el mensaje de error es explícito en vez de un 0 rows afectadas
 * silencioso si algún día cambia el `.eq` de abajo.
 */
export async function updateMyTaskStatusAction(taskId: string, status: TaskStatus) {
  const editor = await requireRole(["editor"]);
  const supabase = await createSupabaseServerClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("id, assigned_to")
    .eq("id", taskId)
    .maybeSingle();

  if (!task || task.assigned_to !== editor.id) {
    return { ok: false, error: "No tenés permiso para modificar esta tarea." };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("assigned_to", editor.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath(EDITOR_TASKS_PATH);
  return { ok: true };
}

/** Elimina una tarea. */
export async function deleteTaskAction(taskId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(TASKS_PATH);
  return { ok: true };
}
