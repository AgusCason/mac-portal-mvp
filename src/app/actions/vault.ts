"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Passphrase simétrica de la bóveda — nunca se persiste en la base (viaja
 * como argumento en cada llamada a pgcrypto dentro de las funciones vault_*,
 * ver supabase/migrations/0013_vault.sql). Si falta la env var, preferimos
 * fallar fuerte a guardar/leer secretos con una key vacía.
 */
function getVaultPassphrase(): string {
  const key = process.env.VAULT_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "Falta configurar VAULT_ENCRYPTION_KEY en las variables de entorno — ver .env.example."
    );
  }
  return key;
}

const credentialSchema = z.object({
  label: z.string().min(1, "Ponele un nombre a la credencial"),
  username: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  clientId: z.string().uuid().optional().or(z.literal("")),
});

/** Alta de una credencial — el secreto se cifra en el momento, adentro de la función SQL. */
export async function createVaultCredentialAction(formData: FormData) {
  await requireAdmin();
  const secret = String(formData.get("secret") ?? "");
  if (!secret) return { ok: false, error: "El secreto no puede estar vacío" };

  const parsed = credentialSchema.safeParse({
    label: formData.get("label"),
    username: formData.get("username") ?? undefined,
    url: formData.get("url") ?? "",
    notes: formData.get("notes") ?? undefined,
    clientId: formData.get("clientId") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let passphrase: string;
  try {
    passphrase = getVaultPassphrase();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de configuración" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("vault_add_credential", {
    p_label: parsed.data.label,
    p_username: parsed.data.username || null,
    p_secret: secret,
    p_url: parsed.data.url || null,
    p_notes: parsed.data.notes || null,
    p_client_id: parsed.data.clientId || null,
    p_passphrase: passphrase,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/configuracion/boveda");
  return { ok: true };
}

/** Edita una credencial. Si `secret` viene vacío, se conserva el secreto ya guardado. */
export async function updateVaultCredentialAction(credentialId: string, formData: FormData) {
  await requireAdmin();
  const parsed = credentialSchema.safeParse({
    label: formData.get("label"),
    username: formData.get("username") ?? undefined,
    url: formData.get("url") ?? "",
    notes: formData.get("notes") ?? undefined,
    clientId: formData.get("clientId") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let passphrase: string;
  try {
    passphrase = getVaultPassphrase();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de configuración" };
  }

  const secret = String(formData.get("secret") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("vault_update_credential", {
    p_id: credentialId,
    p_label: parsed.data.label,
    p_username: parsed.data.username || null,
    p_new_secret: secret || null,
    p_url: parsed.data.url || null,
    p_notes: parsed.data.notes || null,
    p_client_id: parsed.data.clientId || null,
    p_passphrase: passphrase,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/configuracion/boveda");
  return { ok: true };
}

/** Descifra y devuelve el secreto de una credencial puntual — bajo demanda, nunca en el listado. */
export async function revealVaultCredentialAction(
  credentialId: string
): Promise<{ ok: true; secret: string } | { ok: false; error: string }> {
  await requireAdmin();

  let passphrase: string;
  try {
    passphrase = getVaultPassphrase();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de configuración" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("vault_reveal_credential", {
    p_id: credentialId,
    p_passphrase: passphrase,
  });

  if (error) return { ok: false, error: error.message };
  if (data == null) return { ok: false, error: "No se pudo descifrar el secreto" };
  return { ok: true, secret: data };
}

/** Elimina una credencial de la bóveda. */
export async function deleteVaultCredentialAction(credentialId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("vault_credentials").delete().eq("id", credentialId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/configuracion/boveda");
  return { ok: true };
}
