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
  {
    name: "get_client_social_metrics",
    description:
      "Trae métricas REALES de redes sociales de un cliente puntual: un resumen agregado por plataforma (alcance, impresiones, engagement promedio, seguidores) de los últimos N días, más las publicaciones de mejor y peor rendimiento en ese período con su detalle (alcance, likes, comentarios, guardados, reproducciones, % de engagement). Usar esta tool ANTES de proponer ideas de contenido, mejoras o de opinar sobre cómo le está yendo a un cliente en redes — comparar publicaciones reales de alto vs bajo rendimiento es la base de cualquier sugerencia concreta, nunca inventar recomendaciones genéricas sin mirar los datos primero. Si el cliente todavía no tiene ninguna cuenta conectada, la tool lo aclara explícitamente.",
    input_schema: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "UUID del cliente." },
        days: {
          type: "number",
          description: "Ventana de días hacia atrás a considerar (default 30, máximo 180).",
        },
      },
      required: ["clientId"],
    },
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
      // `editor_client_assignments` tiene dos FKs a `profiles` (editor_id y
      // assigned_by) — sin desambiguar, PostgREST rechaza toda la consulta
      // (ver el mismo fix en `queries/clients.ts`).
      supabase
        .from("editor_client_assignments")
        .select("id, can_view_chat, can_view_drive, profiles!editor_client_assignments_editor_id_fkey(full_name)")
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

interface SocialPostRow {
  id: string;
  social_account_id: string;
  media_type: string | null;
  permalink: string | null;
  caption: string | null;
  posted_at: string | null;
  reach: number;
  likes: number;
  comments: number;
  saved: number;
  plays: number;
  engagement_rate: number;
}

/**
 * Métricas de redes sociales de un cliente puntual — a diferencia del resto
 * de las tools de este catálogo, acá le damos al asistente datos "de
 * negocio" (rendimiento de contenido) en vez de "de administración de la
 * agencia", justamente para que pueda razonar sobre mejoras de contenido y
 * no solo sobre errores operativos. Se descartan publicaciones con `reach`
 * 0 (sin datos sincronizados todavía) para no confundir al modelo con ceros
 * que no reflejan rendimiento real.
 */
export async function getClientSocialMetrics(
  supabase: AdminClient,
  input: { clientId: string; days?: number }
) {
  const days = input.days && input.days > 0 ? Math.min(input.days, 180) : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: accounts, error: accountsError } = await supabase
    .from("social_accounts")
    .select("id, platform, display_name")
    .eq("client_id", input.clientId);

  if (accountsError) return { error: accountsError.message };
  if (!accounts || accounts.length === 0) {
    return {
      platforms: [],
      topPosts: [],
      bottomPosts: [],
      note: "Este cliente todavía no tiene ninguna cuenta social conectada (ver /admin/redes).",
    };
  }

  const accountIds = accounts.map((a) => a.id);
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  const [{ data: metricRows }, { data: postRows }] = await Promise.all([
    supabase
      .from("social_metrics")
      .select("social_account_id, reach, impressions, engagement_rate, followers, plays, metric_date")
      .in("social_account_id", accountIds)
      .gte("metric_date", since.slice(0, 10)),
    supabase
      .from("social_media_posts")
      .select(
        "id, social_account_id, media_type, permalink, caption, posted_at, reach, likes, comments, saved, plays, engagement_rate"
      )
      .in("social_account_id", accountIds)
      .gte("posted_at", since)
      .gt("reach", 0)
      .order("engagement_rate", { ascending: false }),
  ]);

  const platforms = accounts.map((acc) => {
    const rows = (metricRows ?? []).filter((r) => r.social_account_id === acc.id);
    const totalReach = rows.reduce((sum, r) => sum + (r.reach ?? 0), 0);
    const avgEngagementRate = rows.length
      ? rows.reduce((sum, r) => sum + Number(r.engagement_rate ?? 0), 0) / rows.length
      : 0;
    return {
      platform: acc.platform,
      display_name: acc.display_name,
      followers: rows[0]?.followers ?? null,
      total_reach: totalReach,
      total_impressions: rows.reduce((sum, r) => sum + (r.impressions ?? 0), 0),
      avg_engagement_rate: Number(avgEngagementRate.toFixed(2)),
      total_plays: rows.reduce((sum, r) => sum + (r.plays ?? 0), 0),
      days_with_data: rows.length,
    };
  });

  const posts = ((postRows ?? []) as SocialPostRow[]).map((p) => ({
    id: p.id,
    platform: accountById.get(p.social_account_id)?.platform ?? "—",
    media_type: p.media_type,
    permalink: p.permalink,
    caption: p.caption?.slice(0, 200) ?? null,
    posted_at: p.posted_at,
    reach: p.reach,
    likes: p.likes,
    comments: p.comments,
    saved: p.saved,
    plays: p.plays,
    engagement_rate: p.engagement_rate,
  }));

  const topPosts = posts.slice(0, 5);
  // Solo tiene sentido mostrar "peores" si hay suficiente volumen como para
  // que no sean literalmente las mismas publicaciones que ya salieron arriba.
  const bottomPosts = posts.length > 5 ? posts.slice(-5).reverse() : [];

  return { platforms, topPosts, bottomPosts };
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
    case "get_client_social_metrics":
      return getClientSocialMetrics(supabase, input as { clientId: string; days?: number });
    default:
      return { error: `Tool de lectura desconocida: ${name}` };
  }
}
