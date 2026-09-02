import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updateSession } from "@/lib/supabase/middleware";
import type { Database, UserRole } from "@/types/database";
import { findModuleKeyForPath } from "@/lib/module-route-map";
import { isModuleVisible } from "@/lib/module-visibility";
import {
  CACHE_COOKIE,
  CACHE_TTL_MS,
  ROLE_CACHE_COOKIE_OPTIONS,
  buildRoleCache,
  resolveRoleAndFlagsFromDb,
  type FlagSlim,
  type RoleCache,
} from "@/lib/role-cache";

/** Prefijo de ruta -> roles que pueden entrar. */
const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/admin": ["admin"],
  "/editor": ["editor"],
  "/client": ["client"],
};

const PUBLIC_ROUTES = ["/login", "/auth", "/api/webhooks", "/f"];

/**
 * Cache de `role` + `module_flags` en una cookie httpOnly propia (ver
 * lib/role-cache.ts), para no pegarle a la base dos veces más (profile +
 * module_flags) en cada navegación además del `getUser()` que ya hace
 * `updateSession`. 30s de ventana: un toggle de módulo en Configuración
 * tarda como mucho eso en propagarse a otras pestañas/usuarios — aceptable,
 * porque esto es solo un atajo de UX (redirigir rápido), nunca la barrera
 * de seguridad real: cada página vuelve a pedir `requireRole()` sin cache
 * (ver lib/auth.ts) y RLS sigue siendo el piso real de acceso a los datos,
 * tamperear esta cookie no da acceso a nada que RLS no daría igual.
 *
 * `loginAction` (src/app/actions/auth.ts) ya deja esta misma cookie
 * pre-calentada al loguearse, así que en la práctica el caso normal de "recién
 * logueado" entra directo por el cache-hit de acá abajo, no por la consulta
 * a la base.
 */
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

  const { role, flags } = await resolveRoleAndFlagsFromDb(supabase, userId);

  if (role) {
    supabaseResponse.cookies.set(
      CACHE_COOKIE,
      JSON.stringify(buildRoleCache(userId, role, flags)),
      ROLE_CACHE_COOKIE_OPTIONS
    );
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
