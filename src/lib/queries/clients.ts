import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Client, ClientStatus } from "@/types/database";

/** Lista de clientes visible para el usuario actual (RLS-aware). */
export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getClients]", error.message);
    return [];
  }
  return data ?? [];
}

/** Una plataforma conectada mostrada como chip de ícono en la tarjeta de Cuenta. */
export interface AccountPlatform {
  key: "instagram" | "tiktok" | "facebook" | "youtube" | "website";
  url: string;
}

/** Un integrante de equipo asignado, para el stack de avatares de la tarjeta. */
export interface AccountTeamMember {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** Datos de una Cuenta para la tarjeta estilo MB Suite (Overview de /admin/clientes). */
export interface AccountCardData {
  id: string;
  name: string;
  brandName: string | null;
  logoUrl: string | null;
  status: ClientStatus;
  planName: string | null;
  isFavorite: boolean;
  team: AccountTeamMember[];
  platforms: AccountPlatform[];
  createdAt: string;
}

/**
 * Overview de Cuentas — equivalente a "Cuentas" de MB Suite
 * (`/demo-agency/accounts`): una tarjeta por cliente real de Supabase con
 * logo, plan activo, equipo asignado, plataformas conectadas y favorito
 * personal del admin que está mirando.
 */
export async function getAccountsOverview(profileId: string): Promise<AccountCardData[]> {
  const supabase = await createClient();

  const [{ data: clients, error }, { data: favorites }] = await Promise.all([
    supabase
      .from("clients")
      .select(
        `id, name, brand_name, logo_url, status, created_at,
         social_instagram, social_tiktok, social_facebook, social_youtube, social_website,
         client_plans(status, plans(name)),
         editor_client_assignments(profiles(id, full_name, avatar_url))`
      )
      .order("created_at", { ascending: false }),
    supabase.from("client_favorites").select("client_id").eq("profile_id", profileId),
  ]);

  if (error) {
    console.error("[getAccountsOverview]", error.message);
    return [];
  }

  const favoriteIds = new Set((favorites ?? []).map((f) => f.client_id));

  type RawRow = {
    id: string;
    name: string;
    brand_name: string | null;
    logo_url: string | null;
    status: ClientStatus;
    created_at: string;
    social_instagram: string | null;
    social_tiktok: string | null;
    social_facebook: string | null;
    social_youtube: string | null;
    social_website: string | null;
    client_plans: { status: string; plans: { name: string } | null }[] | null;
    editor_client_assignments:
      | { profiles: { id: string; full_name: string; avatar_url: string | null } | null }[]
      | null;
  };

  return ((clients ?? []) as unknown as RawRow[]).map((c) => {
    const activePlan = (c.client_plans ?? []).find((p) => p.status === "active");
    const platforms: AccountPlatform[] = [
      c.social_instagram && { key: "instagram" as const, url: c.social_instagram },
      c.social_tiktok && { key: "tiktok" as const, url: c.social_tiktok },
      c.social_facebook && { key: "facebook" as const, url: c.social_facebook },
      c.social_youtube && { key: "youtube" as const, url: c.social_youtube },
      c.social_website && { key: "website" as const, url: c.social_website },
    ].filter((p): p is AccountPlatform => Boolean(p));

    const teamMap = new Map<string, AccountTeamMember>();
    for (const a of c.editor_client_assignments ?? []) {
      if (a.profiles) {
        teamMap.set(a.profiles.id, {
          id: a.profiles.id,
          name: a.profiles.full_name,
          avatarUrl: a.profiles.avatar_url,
        });
      }
    }

    return {
      id: c.id,
      name: c.name,
      brandName: c.brand_name,
      logoUrl: c.logo_url,
      status: c.status,
      planName: activePlan?.plans?.name ?? null,
      isFavorite: favoriteIds.has(c.id),
      team: Array.from(teamMap.values()),
      platforms,
      createdAt: c.created_at,
    } satisfies AccountCardData;
  });
}

export interface ClientDetail {
  client: Client;
  planName: string | null;
  driveFolders: { folder_type: string; drive_folder_id: string }[];
  assignments: {
    id: string;
    editor_id: string;
    editor_name: string;
    can_view_chat: boolean;
    can_view_drive: boolean;
  }[];
  contentCount: number;
  contractCount: number;
}

/** Ficha completa de un cliente para /admin/clientes/[id]. */
export async function getClientDetail(clientId: string): Promise<ClientDetail | null> {
  const supabase = await createClient();

  const [{ data: client }, { data: planRow }, { data: driveFolders }, { data: assignments }, { count: contentCount }, { count: contractCount }] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase
        .from("client_plans")
        .select("plans(name)")
        .eq("client_id", clientId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle(),
      supabase.from("drive_folders").select("folder_type, drive_folder_id").eq("client_id", clientId),
      supabase
        .from("editor_client_assignments")
        .select("id, editor_id, can_view_chat, can_view_drive, profiles(full_name, email)")
        .eq("client_id", clientId),
      supabase
        .from("content_items")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId),
      supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId),
    ]);

  if (!client) return null;

  return {
    client,
    planName: (planRow?.plans as unknown as { name: string } | null)?.name ?? null,
    driveFolders: driveFolders ?? [],
    assignments: (assignments ?? []).map((a) => {
      const p = a.profiles as unknown as { full_name: string; email: string } | null;
      return {
        id: a.id,
        editor_id: a.editor_id,
        editor_name: p?.full_name || p?.email || "—",
        can_view_chat: a.can_view_chat,
        can_view_drive: a.can_view_drive,
      };
    }),
    contentCount: contentCount ?? 0,
    contractCount: contractCount ?? 0,
  };
}
