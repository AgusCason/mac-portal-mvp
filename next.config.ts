import type { NextConfig } from "next";

// Origin real de Supabase (Auth/Storage/Realtime), calculado una vez a
// partir de la misma env var que ya usa el resto de la app — así el CSP de
// abajo no depende de mantener a mano un dominio hardcodeado.
const SUPABASE_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();

// Content-Security-Policy en modo REPORT-ONLY (no bloquea nada, solo loguea
// violaciones en la consola del navegador) — primer paso antes de poder
// activar una CSP real algún día. `script-src`/`style-src` todavía llevan
// 'unsafe-inline' porque Next.js mete scripts de hidratación y este layout
// tiene un <style> inline (branding dinámico, ver app/layout.tsx) sin nonce
// wireado — pasar a una CSP que bloquee de verdad requiere ese trabajo
// aparte. Mientras tanto, esto ya deja ver en la consola qué se rompería.
const CONTENT_SECURITY_POLICY_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${SUPABASE_ORIGIN ? ` ${SUPABASE_ORIGIN}` : ""}`,
  "font-src 'self'",
  `connect-src 'self'${SUPABASE_ORIGIN ? ` ${SUPABASE_ORIGIN}` : ""}`,
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

// Headers de seguridad aplicados a toda la app. Conservadores a propósito
// para no romper nada existente: la CSP de arriba es report-only, así que
// no tiene costo de compatibilidad; el resto son protecciones que tampoco
// lo tienen — clickjacking, MIME sniffing, filtración de referrer, y
// permisos de cámara/micrófono/geolocalización que esta app no usa. HSTS
// solo importa en producción (Netlify sirve HTTPS siempre), pero no
// molesta en local.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy-Report-Only", value: CONTENT_SECURITY_POLICY_REPORT_ONLY },
];

const nextConfig: NextConfig = {
  // `pdfkit` (Reportes con IA — Tarea #23) carga sus fuentes .afm leyendo
  // archivos del propio paquete en disco (`__dirname`-relative) en vez de
  // importarlos como módulos JS. Si Next lo empaqueta con el resto del
  // Server Action, esos archivos quedan afuera del bundle y falla en
  // producción (funciona en local porque ahí node_modules/ está intacto).
  // `serverExternalPackages` le dice a Next que lo deje como un
  // `require()` normal en tiempo de ejecución, sin tocarlo — así sus
  // rutas relativas a node_modules/pdfkit siguen siendo válidas.
  serverExternalPackages: ["pdfkit"],

  // Cache del lado del cliente para navegaciones entre páginas dinámicas
  // (todas las de este portal lo son, por la auth por-cookie). Default de
  // Next 15+ es 0s = cero cache, así que ir y volver a una página que
  // visitaste hace 5 segundos vuelve a pagar el viaje completo al servidor.
  // 30s acá calca el mismo criterio de tolerancia que ya usa `mac_rc` (el
  // cookie de cache de rol/módulos en proxy.ts) — no es un dato nuevo que
  // se vuelve "más viejo", es la MISMA ventana de frescura que el resto de
  // la app ya acepta. `revalidatePath()` en cualquier Server Action sigue
  // invalidando esa página puntual al toque, así que una edición real nunca
  // queda pisada por esto.
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
