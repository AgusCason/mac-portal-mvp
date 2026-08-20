import type { NextConfig } from "next";

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
};

export default nextConfig;
