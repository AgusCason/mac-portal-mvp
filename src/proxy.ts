import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { ModuleFlag, UserRole } from "@/types/database";
import { findModuleKeyForPath } from "@/lib/module-route-map";
import { isModuleVisible } from "@/lib/module-visibility";

/** Prefijo de ruta -> roles que pueden entrar. */
const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/admin": ["admin"],
  "/editor": ["editor"],
  "/client": ["client"],
};

const PUBLIC_ROUTES = ["/login", "/auth", "/api/webhooks", "/f"];

// Next.js 16 renombró `middleware.ts` a `proxy.ts` (misma funcionalidad,
// la función debe llamarse `proxy` — ver AGENTS.md de este repo).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user, role, supabase } = await updateSession(request);

  const isPublic = PUBLIC_ROUTES.some((p) => pathname.startsWith(p));
  if (isPublic) return supabaseResponse;

  // No autenticado -> a login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

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
    if (!role || !allowedRoles.includes(role as UserRole)) {
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

    if (keysToCheck.size > 0) {
      const { data: flagRows } = await supabase
        .from("module_flags")
        .select("*")
        .in("key", Array.from(keysToCheck));
      const flags = new Map((flagRows ?? []).map((f) => [f.key, f as ModuleFlag]));

      const blocked = Array.from(keysToCheck).some(
        (key) => !isModuleVisible(flags.get(key), role as UserRole)
      );
      if (blocked) {
        const url = request.nextUrl.clone();
        url.pathname = `/${role}`;
        return NextResponse.redirect(url);
      }
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
