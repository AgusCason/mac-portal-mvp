import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * `next` viene de un query param controlado por quien arma la URL, no por
 * nosotros — si se usara tal cual en `new URL(next, origin)`, un valor
 * absoluto (`next=https://sitio-falso.com`) pisa el `origin` y esto
 * redirige fuera del dominio JUSTO después de crear una sesión real (open
 * redirect clásico, y particularmente feo acá porque pasa con la sesión ya
 * autenticada). Solo se acepta un path relativo que empiece con "/" simple
 * (no "//", que el navegador interpreta como protocol-relative = absoluto);
 * cualquier otra cosa cae al default.
 */
function safeNextPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/auth/actualizar-password";
}

/**
 * Único punto de retorno de los links de email de Supabase Auth (hoy: el
 * de "olvidé mi contraseña" — src/app/actions/auth.ts; a futuro sirve
 * igual para cualquier otro flujo basado en `resetPasswordForEmail` /
 * `signInWithOtp`). Intercambia el `code` de la URL por una sesión real
 * (queda en cookies) y de ahí manda a `next` — por defecto, a poner la
 * contraseña nueva. Ruta pública (ver PUBLIC_ROUTES en proxy.ts: "/auth").
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.nextUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=reset_link_invalid", request.nextUrl.origin)
  );
}
