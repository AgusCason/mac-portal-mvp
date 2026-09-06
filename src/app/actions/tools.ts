"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Passphrase simétrica reutilizada de la Bóveda (VAULT_ENCRYPTION_KEY) — las
 * contraseñas de Herramientas se cifran con el mismo esquema pgcrypto (ver
 * 0040_editor_finance_and_tools.sql), así que no hace falta una env var
 * nueva. Nunca se persiste: viaja como argumento en cada llamada a
 * agency_tool_create/update/reveal_password.
 */
function getToolsPassphrase(): string {
  const key = process.env.VAULT_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "Falta configurar VAULT_ENCRYPTION_KEY en las variables de entorno — ver .env.example."
    );
  }
  return key;
}

const toolSchema = z.object({
  name: z.string().min(1, "Ponele un nombre a la herramienta"),
  purpose: z.string().optional(),
  url: z.string().url("URL inválida").optional().or(z.literal("")),
  accountEmail: z.string().optional(),
  notes: z.string().optional(),
});

/** Alta de una herramienta — la contraseña se cifra en el momento, adentro de la función SQL. */
export async function createToolAction(formData: FormData) {
  await requireAdmin();
  const parsed = toolSchema.safeParse({
    name: formData.get("name"),
    purpose: formData.get("purpose") ?? undefined,
    url: formData.get("url") || "",
    accountEmail: formData.get("accountEmail") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let passphrase: string;
  try {
    passphrase = getToolsPassphrase();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de configuración" };
  }

  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("agency_tool_create", {
    p_name: parsed.data.name,
    p_purpose: parsed.data.purpose || null,
    p_url: parsed.data.url || null,
    p_account_email: parsed.data.accountEmail || null,
    p_password: password || null,
    p_notes: parsed.data.notes || null,
    p_passphrase: passphrase,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/herramientas");
  return { ok: true };
}

/** Edita una herramienta. Si `password` viene vacío, se conserva la ya guardada. */
export async function updateToolAction(toolId: string, formData: FormData) {
  await requireAdmin();
  const parsed = toolSchema.safeParse({
    name: formData.get("name"),
    purpose: formData.get("purpose") ?? undefined,
    url: formData.get("url") || "",
    accountEmail: formData.get("accountEmail") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let passphrase: string;
  try {
    passphrase = getToolsPassphrase();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de configuración" };
  }

  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("agency_tool_update", {
    p_id: toolId,
    p_name: parsed.data.name,
    p_purpose: parsed.data.purpose || null,
    p_url: parsed.data.url || null,
    p_account_email: parsed.data.accountEmail || null,
    p_new_password: password || null,
    p_notes: parsed.data.notes || null,
    p_passphrase: passphrase,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/herramientas");
  revalidatePath("/editor/herramientas");
  return { ok: true };
}

/** Elimina una herramienta (y sus accesos compartidos, en cascada). */
export async function deleteToolAction(toolId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("agency_tools").delete().eq("id", toolId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/herramientas");
  revalidatePath("/editor/herramientas");
  return { ok: true };
}

/**
 * Descifra y devuelve la contraseña de una herramienta — admin siempre, o un
 * editor al que se la compartieron (la función SQL hace ese chequeo real,
 * ver `agency_tool_reveal_password`; acá solo se exige sesión de admin o
 * editor para no dejar la acción abierta a clientes).
 */
export async function revealToolPasswordAction(
  toolId: string
): Promise<{ ok: true; password: string } | { ok: false; error: string }> {
  await requireRole(["admin", "editor"]);

  let passphrase: string;
  try {
    passphrase = getToolsPassphrase();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de configuración" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("agency_tool_reveal_password", {
    p_id: toolId,
    p_passphrase: passphrase,
  });

  if (error) return { ok: false, error: error.message };
  if (data == null) return { ok: false, error: "Esta herramienta no tiene contraseña guardada." };
  return { ok: true, password: data };
}

/**
 * Reemplaza la lista completa de editores con acceso a una herramienta —
 * la UI manda siempre el set final (selección múltiple + botón "Todo el
 * equipo" son ambos, del lado del cliente, formas de armar esa misma lista),
 * así que acá se calcula el diff: se borran los que ya no están, se agregan
 * los nuevos, y solo a los nuevos se les avisa por notificación.
 */
export async function setToolAccessAction(toolId: string, editorIds: string[]) {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [{ data: tool }, { data: current }] = await Promise.all([
    supabase.from("agency_tools").select("name").eq("id", toolId).single(),
    supabase.from("agency_tool_access").select("editor_id").eq("tool_id", toolId),
  ]);

  const currentIds = new Set((current ?? []).map((r) => r.editor_id));
  const nextIds = new Set(editorIds);
  const toAdd = editorIds.filter((id) => !currentIds.has(id));
  const toRemove = Array.from(currentIds).filter((id) => !nextIds.has(id));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("agency_tool_access")
      .delete()
      .eq("tool_id", toolId)
      .in("editor_id", toRemove);
    if (error) return { ok: false, error: error.message };
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from("agency_tool_access").insert(
      toAdd.map((editorId) => ({ tool_id: toolId, editor_id: editorId, granted_by: admin.id }))
    );
    if (error) return { ok: false, error: error.message };

    await Promise.all(
      toAdd.map((editorId) =>
        supabase.rpc("notify_user", {
          p_profile_id: editorId,
          p_title: "Nueva herramienta compartida",
          p_body: `Te dieron acceso a "${tool?.name ?? "una herramienta"}".`,
          p_link: "/editor/herramientas",
        })
      )
    );
  }

  revalidatePath("/admin/herramientas");
  revalidatePath("/editor/herramientas");
  return { ok: true };
}
