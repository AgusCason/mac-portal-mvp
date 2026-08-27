import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Setup mínimo de testing (no había ninguno en el repo). Alcance a
 * propósito: solo lógica pura (sin Supabase real, sin Next.js runtime) —
 * ver comentario en src/lib/i18n/dictionary.test.ts para el porqué. Mismo
 * alias `@/*` que usa el resto del proyecto (tsconfig.json), para poder
 * importar los mismos módulos de src/ sin duplicar rutas relativas.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
