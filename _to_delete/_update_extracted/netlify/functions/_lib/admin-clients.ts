import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/types/database";

/**
 * Cliente de Supabase con la Service Role Key, para usar desde Netlify
 * Scheduled Functions — corren fuera del runtime de Next.js (sin cookies,
 * sin sesión de usuario), así que no podemos reusar `lib/supabase/server.ts`
 * (que importa `next/headers`, solo disponible dentro de un request de
 * Next.js). Esta es una copia mínima y aislada de la misma idea: acceso
 * completo bypasseando RLS, restringido a código de servidor de confianza
 * (nunca se referencia desde `src/`, ver `check-rules.mjs` regla
 * `no-raw-service-role-key`).
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en las variables de entorno de Netlify."
    );
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
