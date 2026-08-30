import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updateSession } from "@/lib/supabase/middleware";
import type { Database, UserRole } from "@/types/database";
import { findModuleKeyForPath } from "@/lib/module-route-map";
import { isModuleVisible, mergeClientOverrides } from "@/lib/module-visibility";

/** Solo lo que `isModuleVisible` necesita — la cookie de cache no carga
 *  `updated_at`/`updated_by` de las 18 filas de `module_flags` de arriba. */
interface FlagSlim {
  enabled: boolean;
  visible_to_editor: boolean;
  visible_to_client: boolean;
}

/** Prefijo de ruta -> roles que pueden entrar. */
const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/admin": ["admin"],
  "/editor": ["editor"],
  "/client": ["client"],
};

const PUBLIC_ROUTES = ["/login", "/auth", "/api/webhooks", "/f"];

/**
 * Cache de `role` + `module_flags` en una cookie httpOnly propia, para no
 * pegarle a la base dos veces más (profile + module_flags) en cada
 * navegación además del `getUser()` que ya hace `updateSession`. 30s de
 * ventana: un toggle de módulo en Configuración tarda como mucho eso en
 * propagarse a otras pestañas/usuarios — aceptable, porque esto es solo
 * un atajo de UX (redirigir rápido), nunca la barrera de seguridad real:
 * cada página vuelve a pedir `requireRole()` sin cache (ver lib/auth.ts) y
 * RLS sigue siendo el piso real de acceso a los datos, tamperear esta
 * cookie no da acceso a nada que RLS no daría igual.
 */
const CACHE_COOKIE = "mac_rc";
const CACHE_TTL_MS = 30_000;

interface RoleCache {
  uid: string;
  role: UserRole;
  flags: Record<string, FlagSlim>;
  ts: number;
}

async function resolveRoleAndFlags(
  request: NextRequest,
  supabaseResponse: NextResponse,
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ role: UserRole | null; flags: Record<string, FlagSlim> }> {
  const raw = request.cookies.get(CACHE_COOKIE)?.value;
  if (raw) {
    try {
      const cached = JSON.parse(raw) as RoleCache;
      if (cached.uid === userId && Date.now() - cached.ts < CACHE_TTL_MS) {
        return { role: cached.role, flags: cached.flags };
      }
    } catch {
      // cookie corrupta/vieja -> recalculamos abajo
    }
  }

  const [{ data: profile }, { data: flagRows }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).single(),
    supabase.from("module_flags").select("key, enabled, visible_to_editor, visible_to_client"),
  ]);

  const role = (profile?.role as UserRole | undefined) ?? null;
  let flags = Object.fromEntries(
    (flagRows ?? []).map((f) => [
      f.key,
      { enabled: f.enabled, visible_to_editor: f.visible_to_editor, visible_to_client: f.visible_to_client },
    ])
  );

  // Acceso por cliente puntual (client_module_overrides) — capa fina sobre
  // el `visible_to_client` general, ver ficha de cliente > pestaña Accesos.
  // Solo aplica al rol "client"; admin/editor no tienen client_id propio.
  if (role === "client") {
    const { data: memberRow } = await supabase
      .from("client_members")
      .select("client_id")
      .eq("profile_id", userId)
      .limit(1)
      .maybeSingle();
    if (memberRow?.client_id) {
      const { data: overrideRows } = await supabase
        .from("client_module_overrides")
        .select("module_key, visible")
        .eq("client_id", memberRow.client_id);
      const overrides = Object.fromEntries(
        (overrideRows ?? []).map((o) => [o.module_key, o.visible])
      );
      flags = mergeClientOverrides(flags, overrides);
    }
  }

  if (role) {
    const cache: RoleCache = { uid: userId, role, flags, ts: Date.now() };
    supabaseResponse.cookies.set(CACHE_COOKIE, JSON.stringify(cache), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60,
    });
  }

  return { role, flags };
}

// Next.js 16 renombró `middleware.ts` a `proxy.ts` (misma funcionalidad,
// la función debe llamarse `proxy` — ver AGENTS.md de este repo).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user, supabase } = await updateSession(request);

  const isPublic = PUBLIC_ROUTES.some((p) => pathname.startsWith(p));
  if (isPublic) return supabaseResponse;

  // No autenticado -> a login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const { role, flags } = await resolveRoleAndFlags(request, supabaseResponse, supabase, user.id);

  // Rutas raíz protegidas: /dashboard redirige según rol
  if (pathname === "/" || pathname === "/dashboard") {
    const url = request.nextUrl.clone();
    url.pathname = role ? `/${role}` : "/login";
    return NextResponse.redirect(url);
  }

  // Chequeo de RBAC por prefijo de ruta
  const matchedPrefix = Object.keys(ROLE_ROUTES).find((prefix) =>
    pathname.startsWith(prefix)
  );
  if (matchedPrefix) {
    const allowedRoles = ROLE_ROUTES[matchedPrefix];
    if (!role || !allowedRoles.includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/no-autorizado";
      return NextResponse.redirect(url);
    }
  }

  // Fase F2: bloqueo por URL de módulos apagados/no-visibles para el rol
  // (ver Configuración > Módulos). "portal-clientes" es especial: gatea todo
  // el prefijo /client, no una sub-ruta puntual.
  if (role) {
    const keysToCheck = new Set<string>();
    const routeKey = findModuleKeyForPath(pathname);
    // Nunca se bloquea el propio panel de Módulos al admin: si no, apagarlo
    // por error dejaría a todos sin forma de volver a prenderlo.
    if (routeKey && !(role === "admin" && routeKey === "config-modulos")) {
      keysToCheck.add(routeKey);
    }
    if (pathname.startsWith("/client")) keysToCheck.add("portal-clientes");

    const blocked = Array.from(keysToCheck).some(
      (key) => !isModuleVisible(flags[key], role)
    );
    if (blocked) {
      const url = request.nextUrl.clone();
      url.pathname = `/${role}`;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Corre en todas las rutas excepto assets estáticos y la propia
     * página de login/auth (para no quedar en loop de redirects).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
