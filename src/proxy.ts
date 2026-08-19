import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { UserRole } from "@/types/database";

/** Prefijo de ruta -> roles que pueden entrar. */
const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/admin": ["admin"],
  "/editor": ["editor"],
  "/client": ["client"],
};

const PUBLIC_ROUTES = ["/login", "/auth", "/api/webhooks"];

// Next.js 16 renombró `middleware.ts` a `proxy.ts` (misma funcionalidad,
// la función debe llamarse `proxy` — ver AGENTS.md de este repo).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user, role } = await updateSession(request);

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
