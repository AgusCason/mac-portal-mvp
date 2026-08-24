import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ContentStatus } from "@/types/database";

const STATUS_ORDER: ContentStatus[] = [
  "borrador",
  "en_edicion",
  "por_aprobar",
  "requiere_cambios",
  "aprobado",
  "programado",
  "publicado",
];

function emptyStatusMap(): Record<ContentStatus, number> {
  return Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<
    ContentStatus,
    number
  >;
}

export interface AdminDashboardData {
  totalClients: number;
  activeClients: number;
  totalEditors: number;
  monthlyRevenue: number;
  contentByStatus: Record<ContentStatus, number>;
  pendingApprovals: { id: string; title: string; client_name: string }[];
  recentClients: { id: string; name: string; status: string; created_at: string }[];
  metricAlerts: {
    id: string;
    client_name: string;
    metric_type: string;
    drop_pct: number;
    metric_date: string;
  }[];
}

/** Datos agregados para el dashboard del Super Administrador. */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();

  const [
    { count: totalClients },
    { count: activeClients },
    { count: totalEditors },
    { data: contentRows },
    { data: pendingRows },
    { data: recentClients },
    { data: planRows },
    { data: metricAlertRows },
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "editor"),
    supabase.from("content_items").select("status"),
    supabase
      .from("content_items")
      .select("id, title, clients(name)")
      .eq("status", "por_aprobar")
      .limit(6),
    supabase
      .from("clients")
      .select("id, name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("client_plans")
      .select("price_override, plans(price_monthly)")
      .eq("status", "active"),
    supabase
      .from("metric_alerts")
      .select("id, metric_type, drop_pct, metric_date, clients(name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const contentByStatus = emptyStatusMap();
  for (const row of contentRows ?? []) {
    const status = row.status as ContentStatus;
    contentByStatus[status] = (contentByStatus[status] ?? 0) + 1;
  }

  const monthlyRevenue = (planRows ?? []).reduce((sum, row) => {
    const plan = row.plans as unknown as { price_monthly: number } | null;
    const price = row.price_override ?? plan?.price_monthly ?? 0;
    return sum + price;
  }, 0);

  return {
    totalClients: totalClients ?? 0,
    activeClients: activeClients ?? 0,
    totalEditors: totalEditors ?? 0,
    monthlyRevenue,
    contentByStatus,
    pendingApprovals: (pendingRows ?? []).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      client_name:
        ((r.clients as unknown as { name: string } | null)?.name) ?? "—",
    })),
    recentClients: (recentClients ?? []) as AdminDashboardData["recentClients"],
    metricAlerts: (metricAlertRows ?? []).map((row) => ({
      id: row.id,
      client_name: (row.clients as unknown as { name: string } | null)?.name ?? "—",
      metric_type: row.metric_type,
      drop_pct: row.drop_pct,
      metric_date: row.metric_date,
    })),
  };
}

export interface EditorDashboardData {
  assignedClients: {
    client_id: string;
    name: string;
    can_view_chat: boolean;
    can_view_drive: boolean;
  }[];
  myContentByStatus: Record<ContentStatus, number>;
  needsChanges: { id: string; title: string; client_name: string }[];
  upcoming: { id: string; title: string; scheduled_at: string; client_name: string }[];
}

/** Datos agregados para el dashboard del Editor (solo sus clientes asignados). */
export async function getEditorDashboardData(
  editorId: string
): Promise<EditorDashboardData> {
  const supabase = await createClient();

  const [{ data: assignments }, { data: contentRows }] = await Promise.all([
    supabase
      .from("editor_client_assignments")
      .select("client_id, can_view_chat, can_view_drive, clients(name)")
      .eq("editor_id", editorId),
    supabase
      .from("content_items")
      .select("id, title, status, scheduled_at, clients(name)")
      .eq("assigned_editor_id", editorId),
  ]);

  const myContentByStatus = emptyStatusMap();
  const needsChanges: EditorDashboardData["needsChanges"] = [];
  const upcoming: EditorDashboardData["upcoming"] = [];

  for (const row of contentRows ?? []) {
    const status = row.status as ContentStatus;
    myContentByStatus[status] = (myContentByStatus[status] ?? 0) + 1;
    const clientName =
      ((row.clients as unknown as { name: string } | null)?.name) ?? "—";

    if (status === "requiere_cambios") {
      needsChanges.push({ id: row.id, title: row.title, client_name: clientName });
    }
    if (row.scheduled_at) {
      upcoming.push({
        id: row.id,
        title: row.title,
        scheduled_at: row.scheduled_at,
        client_name: clientName,
      });
    }
  }

  return {
    assignedClients: (assignments ?? []).map((a) => ({
      client_id: a.client_id,
      name: ((a.clients as unknown as { name: string } | null)?.name) ?? "—",
      can_view_chat: a.can_view_chat,
      can_view_drive: a.can_view_drive,
    })),
    myContentByStatus,
    needsChanges: needsChanges.slice(0, 6),
    upcoming: upcoming
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
      .slice(0, 6),
  };
}

export interface ClientDashboardData {
  client: {
    id: string;
    name: string;
    brand_name: string | null;
    status: "active" | "paused" | "churned";
    billing_cutoff_day: number | null;
  } | null;
  planName: string | null;
  monthlyQuota: number | null;
  deliveredThisMonth: number;
  /** Próxima fecha de corte de facturación, ya calculada (ISO, solo fecha). */
  nextCutoffDate: string | null;
  contentByStatus: Record<ContentStatus, number>;
  pendingReview: { id: string; title: string; network: string }[];
  pendingContracts: number;
}

/** Próxima fecha (a partir de hoy) en la que cae el día de corte indicado. */
function computeNextCutoffDate(cutoffDay: number, today: Date): string {
  const clampDay = (year: number, month: number) => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    return Math.min(cutoffDay, lastDayOfMonth);
  };

  const year = today.getFullYear();
  const month = today.getMonth();
  const thisMonthCutoff = new Date(year, month, clampDay(year, month));

  const target =
    thisMonthCutoff.getTime() >= new Date(year, month, today.getDate()).getTime()
      ? thisMonthCutoff
      : new Date(year, month + 1, clampDay(year, month + 1));

  return target.toISOString().slice(0, 10);
}

/** Datos agregados para el dashboard del portal Cliente. */
export async function getClientDashboardData(
  clientId: string
): Promise<ClientDashboardData> {
  const supabase = await createClient();

  const [
    { data: client },
    { data: planRow },
    { data: contentRows },
    { count: pendingContracts },
    { count: deliveredThisMonth },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, brand_name, status, billing_cutoff_day")
      .eq("id", clientId)
      .single(),
    supabase
      .from("client_plans")
      .select("plans(name, monthly_quota)")
      .eq("client_id", clientId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("content_items")
      .select("id, title, status, network")
      .eq("client_id", clientId),
    supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("status", "pendiente"),
    supabase
      .from("content_items")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("status", "publicado")
      .gte("updated_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const contentByStatus = emptyStatusMap();
  const pendingReview: ClientDashboardData["pendingReview"] = [];
  for (const row of contentRows ?? []) {
    const status = row.status as ContentStatus;
    contentByStatus[status] = (contentByStatus[status] ?? 0) + 1;
    if (status === "por_aprobar") {
      pendingReview.push({ id: row.id, title: row.title, network: row.network });
    }
  }

  const plan = planRow?.plans as unknown as { name: string; monthly_quota: number | null } | null;

  return {
    client: client ?? null,
    planName: plan?.name ?? null,
    monthlyQuota: plan?.monthly_quota ?? null,
    deliveredThisMonth: deliveredThisMonth ?? 0,
    nextCutoffDate: client?.billing_cutoff_day
      ? computeNextCutoffDate(client.billing_cutoff_day, new Date())
      : null,
    contentByStatus,
    pendingReview: pendingReview.slice(0, 6),
    pendingContracts: pendingContracts ?? 0,
  };
}
