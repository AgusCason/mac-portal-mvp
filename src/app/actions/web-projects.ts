"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { WebAssetStatus, WebProjectStage } from "@/types/database";

const webProjectSchema = z.object({
  title: z.string().min(2, "El título es obligatorio"),
  description: z.string().optional(),
  clientId: z.string().uuid("Elegí una cuenta"),
});

export type CreateWebProjectResult = { ok: true; projectId: string } | { ok: false; error: string };

/** Crea un proyecto de Sitios Web nuevo (arranca en la etapa "brief"). */
export async function createWebProjectAction(formData: FormData): Promise<CreateWebProjectResult> {
  const admin = await requireAdmin();
  const parsed = webProjectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    clientId: formData.get("clientId"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("web_projects")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || "",
      client_id: parsed.data.clientId,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "No se pudo crear el proyecto" };
  revalidatePath("/admin/sitios-web");
  return { ok: true, projectId: data.id };
}

/** Cambia la etapa de un proyecto de Sitios Web. */
export async function updateWebProjectStageAction(projectId: string, stage: WebProjectStage) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("web_projects")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/sitios-web");
  revalidatePath(`/admin/sitios-web/${projectId}`);
  revalidatePath("/client/sitio-web");
  return { ok: true };
}

const detailsSchema = z.object({
  domain: z.string().optional(),
  stagingUrl: z.string().optional(),
  productionUrl: z.string().optional(),
  hostingProvider: z.string().optional(),
  techStack: z.string().optional(),
  launchDate: z.string().optional(),
});

/** Actualiza los datos técnicos (dominio, staging, hosting, stack, fecha de lanzamiento). */
export async function updateWebProjectDetailsAction(projectId: string, formData: FormData) {
  await requireAdmin();
  const parsed = detailsSchema.safeParse({
    domain: formData.get("domain") ?? "",
    stagingUrl: formData.get("stagingUrl") ?? "",
    productionUrl: formData.get("productionUrl") ?? "",
    hostingProvider: formData.get("hostingProvider") ?? "",
    techStack: formData.get("techStack") ?? "",
    launchDate: formData.get("launchDate") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("web_projects")
    .update({
      domain: parsed.data.domain || null,
      staging_url: parsed.data.stagingUrl || null,
      production_url: parsed.data.productionUrl || null,
      hosting_provider: parsed.data.hostingProvider || null,
      tech_stack: parsed.data.techStack || null,
      launch_date: parsed.data.launchDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/sitios-web/${projectId}`);
  revalidatePath("/client/sitio-web");
  return { ok: true };
}

/** Elimina un proyecto de Sitios Web (cascada a sus entregables). */
export async function deleteWebProjectAction(projectId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("web_projects").delete().eq("id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/sitios-web");
  return { ok: true };
}

const assetSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  fileUrl: z.string().url("Tiene que ser una URL válida"),
});

/** Agrega un entregable (mockup, link de staging, etc.) a un proyecto. */
export async function createWebProjectAssetAction(projectId: string, formData: FormData) {
  await requireAdmin();
  const parsed = assetSchema.safeParse({
    title: formData.get("title"),
    fileUrl: formData.get("fileUrl"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("web_project_assets").insert({
    web_project_id: projectId,
    title: parsed.data.title,
    file_url: parsed.data.fileUrl,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/sitios-web/${projectId}`);
  revalidatePath("/client/sitio-web");
  return { ok: true };
}

/** Elimina un entregable. */
export async function deleteWebProjectAssetAction(assetId: string, projectId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("web_project_assets").delete().eq("id", assetId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/sitios-web/${projectId}`);
  revalidatePath("/client/sitio-web");
  return { ok: true };
}

/**
 * El cliente aprueba o pide cambios sobre un entregable propio (vía RPC
 * `set_web_asset_approval`, security definer) — mismo patrón que
 * `signContractAction` / `set_content_approval`.
 */
export async function submitWebAssetDecisionAction(
  assetId: string,
  decision: Extract<WebAssetStatus, "aprobado" | "requiere_cambios">,
  note?: string
) {
  await requireRole(["client"]);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("set_web_asset_approval", {
    target_asset_id: assetId,
    new_status: decision,
    note: note && note.trim().length > 0 ? note.trim() : null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/client/sitio-web");
  revalidatePath("/admin/sitios-web");
  return { ok: true };
}
