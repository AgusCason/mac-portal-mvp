import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AgencyBranding } from "@/types/database";

export const DEFAULT_BRANDING: AgencyBranding = {
  id: true,
  app_name: "MAC Portal",
  logo_light_url: null,
  logo_dark_url: null,
  favicon_url: null,
  primary_color: "#2563EB",
  accent_color: "#2563EB",
  font_heading: "Inter",
  font_body: "Inter",
  button_shape: "rounded",
  button_style: "filled",
  updated_at: new Date(0).toISOString(),
  updated_by: null,
};

/**
 * Config de branding white-label (Fase 3.1 — Configuración > Marca). Se lee
 * con el cliente normal: la policy `agency_branding_select_all` permite
 * lectura pública (incluso sin sesión, para que /login también pueda
 * mostrarla). Nunca debe tirar — si algo falla, se cae a los valores por
 * defecto de MAC Portal en vez de romper toda la app.
 */
export async function getBranding(): Promise<AgencyBranding> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("agency_branding").select("*").maybeSingle();
    if (error || !data) return DEFAULT_BRANDING;
    return data;
  } catch {
    return DEFAULT_BRANDING;
  }
}
