import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const next = request.nextUrl.searchParams.get("next") ?? "/auth/actualizar-password";

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
