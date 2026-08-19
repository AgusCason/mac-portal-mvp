import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Anthropic from "@anthropic-ai/sdk";
import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

/**
 * Tools de SOLO LECTURA que el asistente puede llamar libremente, sin pedir
 * confirmación — nunca mutan nada. Se ejecutan con el cliente de Supabase
 * del admin logueado (no con la Service Role Key), así que RLS sigue siendo
 * el piso de seguridad real incluso si algún día este catálogo creciera.
 *
 * Cada handler devuelve SOLO los campos que hacen falta para razonar sobre
 * el caso de uso (agencia/clientes/contenido/equipo) — nunca tokens, claves
 * de Drive/Meta/WhatsApp, ni contraseñas. Esa es la "minimización de datos"
 * de la que depende el resto del diseño (ver README § Asistente IA).
 */

export const READ_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_clients",
    description:
      "Lista clientes de la agencia con su estado, para ubicar de qué cliente está hablando el admin o hacer un panorama general. Usar `search` para buscar por nombre.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["active", "paused", "churned"],
          description: "Filtrar por estado comercial (opcional).",
        },
        search: {
          type: "string",
          description: "Buscar por nombre o nombre de marca (opcional).",
        },
      },
    },
  },
  {
    name: "get_client_detail",
    description:
      "Trae el detalle de un cliente puntual: plan, carpetas de Drive creadas, editores asignados (con sus permisos) y conteos de contenido/contratos. Usar cuando ya se sabe el client_id (por ejemplo, después de list_clients).",
    input_schema: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "UUID del cliente." },
      },
      required: ["clientId"],
    },
  },
  {
    name: "find_data_issues",
    description:
      "Corre un diagnóstico sobre toda la base de datos de la agencia y devuelve una lista de inconsistencias/errores comunes: clientes activos sin carpetas de Drive, clientes sin ningún editor asignado, asignaciones de editor sin ningún permiso activo (ni chat ni Drive — probable error de carga), contratos pendientes de firma hace más de 30 días, y clientes con email de contacto con formato inválido. Usar esto cuando el admin pida 'revisar errores', 'ver qué está mal' o similar.",
    input_schema: { type: "object", properties: {} },
  },
];

export async function listClients(
  supabase: AdminClient,
  input: { status?: string; search?: string }
) {
  let query = supabase
    .from("clients")
    .select("id, name, brand_name, status, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (input.status) query = query.eq("status", input.status as "active" | "paused" | "churned");
  if (input.search) query = query.ilike("name", `%${input.search}%`);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { clients: data };
}

export async function getClientDetail(supabase: AdminClient, input: { clientId: string }) {
  const [{ data: client }, { data: plan }, { data: drive }, { data: assignments }, { count: contentCount }, { count: contractCount }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name, brand_name, status, contact_email, created_at")
        .eq("id", input.clientId)
        .single(),
      supabase
        .from("client_plans")
        .select("plans(name)")
        .eq("client_id", input.clientId)
        .eq("status", "active")
        .maybeSingle(),
      supabase.from("drive_folders").select("folder_type").eq("client_id", input.clientId),
      supabase
        .from("editor_client_assignments")
        .select("id, can_view_chat, can_view_drive, profiles(full_name)")
        .eq("client_id", input.clientId),
      supabase
        .from("content_items")
        .select("id", { count: "exact", head: true })
        .eq("client_id", input.clientId),
      supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .eq("client_id", input.clientId),
    ]);

  if (!client) return { error: "Cliente no encontrado (o sin acceso)." };

  return {
    client,
    plan: (plan?.plans as unknown as { name: string } | null)?.name ?? null,
    driveFoldersCreated: (drive ?? []).map((d) => d.folder_type),
    editorAssignments: (assignments ?? []).map((a) => ({
      id: a.id,
      editor_name: (a.profiles as unknown as { full_name: string } | null)?.full_name ?? "—",
      can_view_chat: a.can_view_chat,
      can_view_drive: a.can_view_drive,
    })),
    contentItemsCount: contentCount ?? 0,
    contractsCount: contractCount ?? 0,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface DataIssue {
  issue_type: string;
  client_id: string | null;
  client_name: string | null;
  detail: string;
  suggested_action_type?: string;
  suggested_target_id?: string;
}

/**
 * Diagnóstico de datos — esto es lo que hace posible "corregir errores":
 * el admin pide un chequeo, el asistente corre esta función, narra lo que
 * encontró y para cada hallazgo con arreglo automático conocido puede
 * llamar a `propose_change` (que sí requiere confirmación humana).
 */
export async function findDataIssues(supabase: AdminClient): Promise<{ issues: DataIssue[] }> {
  const issues: DataIssue[] = [];

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, status, contact_email");

  const { data: driveFolders } = await supabase.from("drive_folders").select("client_id");
  const clientsWithDrive = new Set((driveFolders ?? []).map((d) => d.client_id));

  const { data: assignments } = await supabase
    .from("editor_client_assignments")
    .select("id, client_id, can_view_chat, can_view_drive");
  const clientsWithEditor = new Set((assignments ?? []).map((a) => a.client_id));

  const { data: pendingContracts } = await supabase
    .from("contracts")
    .select("id, client_id, created_at, clients(name)")
    .eq("status", "pendiente");

  for (const client of clients ?? []) {
    if (client.status === "active" && !clientsWithDrive.has(client.id)) {
      issues.push({
        issue_type: "missing_drive_folders",
        client_id: client.id,
        client_name: client.name,
        detail: `"${client.name}" está activo pero no tiene carpetas de Drive creadas (probablemente falló al momento del alta).`,
        suggested_action_type: "fix_missing_drive_folders",
        suggested_target_id: client.id,
      });
    }
    if (client.status === "active" && !clientsWithEditor.has(client.id)) {
      issues.push({
        issue_type: "no_editor_assigned",
        client_id: client.id,
        client_name: client.name,
        detail: `"${client.name}" no tiene ningún editor asignado.`,
      });
    }
    if (client.contact_email && !EMAIL_RE.test(client.contact_email)) {
      issues.push({
        issue_type: "invalid_contact_email",
        client_id: client.id,
        client_name: client.name,
        detail: `El email de contacto de "${client.name}" ("${client.contact_email}") no tiene formato válido.`,
      });
    }
  }

  for (const a of assignments ?? []) {
    if (!a.can_view_chat && !a.can_view_drive) {
      issues.push({
        issue_type: "editor_no_permissions",
        client_id: a.client_id,
        client_name: null,
        detail: `Hay una asignación de editor (id ${a.id}) sin ningún permiso activo — ni chat ni Drive. Probablemente un olvido al asignarlo.`,
        suggested_action_type: "update_editor_permissions",
        suggested_target_id: a.id,
      });
    }
  }

  for (const c of pendingContracts ?? []) {
    const ageMs = Date.now() - new Date(c.created_at).getTime();
    if (ageMs > THIRTY_DAYS_MS) {
      const name = (c.clients as unknown as { name: string } | null)?.name ?? "—";
      issues.push({
        issue_type: "stale_pending_contract",
        client_id: c.client_id,
        client_name: name,
        detail: `Contrato pendiente de firma de "${name}" hace más de 30 días (id ${c.id}). Puede valer la pena reenviar el recordatorio.`,
      });
    }
  }

  return { issues };
}

export async function executeReadTool(
  name: string,
  input: Record<string, unknown>,
  supabase: AdminClient
): Promise<unknown> {
  switch (name) {
    case "list_clients":
      return listClients(supabase, input as { status?: string; search?: string });
    case "get_client_detail":
      return getClientDetail(supabase, input as { clientId: string });
    case "find_data_issues":
      return findDataIssues(supabase);
    default:
      return { error: `Tool de lectura desconocida: ${name}` };
  }
}
