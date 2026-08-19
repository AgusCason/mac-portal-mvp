"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Cliente de Supabase para Client Components. Usa la Publishable/Anon Key,
 * que es pública por diseño: la seguridad real la impone Row Level Security
 * en la base de datos (ver supabase/migrations/0001_schema.sql).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
