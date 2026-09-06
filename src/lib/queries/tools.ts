import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AgencyTool, ToolCostFrequency } from "@/types/database";

export interface ToolAccessEditor {
  editorId: string;
  name: string;
  email: string;
}

export interface AgencyToolWithAccess extends AgencyTool {
  hasPassword: boolean;
  sharedWith: ToolAccessEditor[];
}

/**
 * Catálogo completo de herramientas para el admin (/admin/herramientas) —
 * nunca trae la contraseña cifrada: eso solo sale bajo demanda vía
 * `revealToolPasswordAction` (misma idea que la Bóveda, ver `VaultList`).
 */
export async function getAgencyTools(limit = 300): Promise<AgencyToolWithAccess[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agency_tools")
    .select(
      // `agency_tool_access` tiene DOS foreign keys a `profiles` (editor_id y
      // granted_by) — sin desambiguar, PostgREST rechaza la consulta ENTERA
      // con "more than one relationship was found" (mismo bug ya visto en
      // `editor_client_assignments`, ver queries/clients.ts).
      "id, name, purpose, url, account_email, notes, cost_amount, cost_currency, cost_frequency, next_renewal_date, created_by, created_at, updated_at, account_password_encrypted, agency_tool_access(editor_id, profiles!agency_tool_access_editor_id_fkey(full_name, email))"
    )
    .order("name")
    .limit(limit);

  if (error) {
    console.error("[getAgencyTools]", error.message);
    return [];
  }

  type RawRow = {
    id: string;
    name: string;
    purpose: string | null;
    url: string | null;
    account_email: string | null;
    notes: string | null;
    cost_amount: number | null;
    cost_currency: string;
    cost_frequency: ToolCostFrequency | null;
    next_renewal_date: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    account_password_encrypted: string | null;
    agency_tool_access:
      | { editor_id: string; profiles: { full_name: string; email: string } | null }[]
      | null;
  };

  return ((data ?? []) as unknown as RawRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    purpose: row.purpose,
    url: row.url,
    account_email: row.account_email,
    notes: row.notes,
    cost_amount: row.cost_amount,
    cost_currency: row.cost_currency,
    cost_frequency: row.cost_frequency,
    next_renewal_date: row.next_renewal_date,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    hasPassword: row.account_password_encrypted != null,
    sharedWith: (row.agency_tool_access ?? []).map((a) => ({
      editorId: a.editor_id,
      name: a.profiles?.full_name || a.profiles?.email || "—",
      email: a.profiles?.email ?? "",
    })),
  }));
}

export interface EditorToolCard {
  id: string;
  name: string;
  purpose: string | null;
  url: string | null;
  accountEmail: string | null;
  hasPassword: boolean;
}

/**
 * Herramientas compartidas con un editor puntual (/editor/herramientas) —
 * solo lo que necesita para usarlas: nombre, para qué es, link y mail. La
 * contraseña se pide aparte, bajo demanda (ver `revealToolPasswordAction`).
 */
export async function getToolsSharedWithEditor(editorId: string): Promise<EditorToolCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agency_tool_access")
    .select("agency_tools(id, name, purpose, url, account_email, account_password_encrypted)")
    .eq("editor_id", editorId);

  if (error) {
    console.error("[getToolsSharedWithEditor]", error.message);
    return [];
  }

  type RawRow = {
    agency_tools: {
      id: string;
      name: string;
      purpose: string | null;
      url: string | null;
      account_email: string | null;
      account_password_encrypted: string | null;
    } | null;
  };

  return ((data ?? []) as unknown as RawRow[])
    .map((row) => row.agency_tools)
    .filter((t): t is NonNullable<typeof t> => t != null)
    .map((t) => ({
      id: t.id,
      name: t.name,
      purpose: t.purpose,
      url: t.url,
      accountEmail: t.account_email,
      hasPassword: t.account_password_encrypted != null,
    }));
}
