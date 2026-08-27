import type { NextConfig } from "next";

// Headers de seguridad aplicados a toda la app. Conservadores a propósito
// para no romper nada existente: no hay CSP con `script-src` restrictivo
// (la app usa varios scripts inline de Next/React), pero sí las protecciones
// que no tienen costo de compatibilidad — clickjacking, MIME sniffing,
// filtración de referrer, y permisos de cámara/micrófono/geolocalización
// que esta app no usa. HSTS solo importa en producción (Netlify sirve HTTPS
// siempre), pero no molesta en local.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
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
