"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const CONTACTS_PATH = "/admin/contactos";

const contactSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  roleTitle: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  tags: z.string().optional(),
  clientId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional(),
});

function parseTags(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseContactForm(formData: FormData) {
  const rawClientId = (formData.get("clientId") as string) || "";
  return contactSchema.safeParse({
    name: formData.get("name"),
    roleTitle: formData.get("roleTitle") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    tags: formData.get("tags") ?? "",
    clientId: rawClientId === "none" ? "" : rawClientId,
    notes: formData.get("notes") ?? "",
  });
}

/** Crea un contacto nuevo. */
export async function createContactAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = parseContactForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { name, roleTitle, email, phone, tags, clientId, notes } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contacts").insert({
    name,
    role_title: roleTitle || null,
    email: email || null,
    phone: phone || null,
    tags: parseTags(tags),
    client_id: clientId || null,
    notes: notes || null,
    created_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(CONTACTS_PATH);
  return { ok: true };
}

/** Edita un contacto existente. */
export async function updateContactAction(contactId: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseContactForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { name, roleTitle, email, phone, tags, clientId, notes } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("contacts")
    .update({
      name,
      role_title: roleTitle || null,
      email: email || null,
      phone: phone || null,
      tags: parseTags(tags),
      client_id: clientId || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contactId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(CONTACTS_PATH);
  return { ok: true };
}

/** Elimina un contacto. */
export async function deleteContactAction(contactId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(CONTACTS_PATH);
  return { ok: true };
}
