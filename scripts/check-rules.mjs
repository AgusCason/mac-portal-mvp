#!/usr/bin/env node
/**
 * Sistema de checkeo propio del proyecto (más allá de lint/typecheck/build).
 * Escanea src/ buscando violaciones a convenciones "duras" que no captura
 * ESLint/TSC por defecto. Se corre como parte de `npm run verify` y en cada
 * PR (ver .github/workflows/ci.yml) — el proyecto no se considera "verde"
 * hasta que esto (y lint/typecheck/build) pasen.
 *
 * Uso: node scripts/check-rules.mjs
 * Exit code 0 = OK, 1 = hay violaciones (se listan todas antes de salir).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC_DIR = join(ROOT, "src");
const CODE_EXTENSIONS = new Set([".ts", ".tsx"]);

/** @type {{file: string, rule: string, detail: string}[]} */
const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (CODE_EXTENSIONS.has(extname(fullPath))) {
      checkFile(fullPath);
    }
  }
}

function checkFile(fullPath) {
  const rel = relative(ROOT, fullPath);
  const content = readFileSync(fullPath, "utf8");
  const lines = content.split("\n");

  // Regla 1 — Server Actions deben empezar con "use server" y no exponer
  // SUPABASE_SERVICE_ROLE_KEY fuera de lib/supabase/server.ts.
  if (rel.startsWith("src/app/actions/") && !content.includes('"use server"')) {
    violations.push({
      file: rel,
      rule: "server-action-directive",
      detail: 'Falta la directiva "use server" al principio del archivo.',
    });
  }

  // Regla 2 — Nada fuera de lib/supabase/server.ts debe referenciar la
  // Service Role Key directamente (debe pasar siempre por
  // createServiceRoleClient()).
  if (
    rel !== "src/lib/supabase/server.ts" &&
    content.includes("SUPABASE_SERVICE_ROLE_KEY")
  ) {
    violations.push({
      file: rel,
      rule: "no-raw-service-role-key",
      detail:
        "Referencia directa a SUPABASE_SERVICE_ROLE_KEY. Usá createServiceRoleClient() desde lib/supabase/server.ts.",
    });
  }

  // Regla 3 — Componentes de src/components/ui (primitivas shadcn) no deben
  // importar Server Actions ni módulos server-only: tienen que ser 100%
  // reutilizables en cliente o servidor sin acoplarse a lógica de negocio.
  if (rel.startsWith("src/components/ui/") && content.includes("@/app/actions/")) {
    violations.push({
      file: rel,
      rule: "ui-primitive-no-actions",
      detail: "Una primitiva de UI no debería importar Server Actions de negocio.",
    });
  }

  // Regla 4 — Colores: nada de hex/rgb/rgba sueltos en className de JSX
  // (todo color sale de los tokens definidos en globals.css). Se excluyen
  // los propios archivos de config de tema.
  const ALLOWED_HEX_FILES = new Set(["src/app/globals.css.ts"]); // (no aplica hoy, placeholder)
  if (!ALLOWED_HEX_FILES.has(rel)) {
    lines.forEach((line, i) => {
      if (/className=(".*?#[0-9a-fA-F]{3,6}.*?"|\{`.*?#[0-9a-fA-F]{3,6}.*?`\})/.test(line)) {
        violations.push({
          file: `${rel}:${i + 1}`,
          rule: "no-hardcoded-hex-in-classname",
          detail: "Color hex hardcodeado en className — usá un token de globals.css.",
        });
      }
    });
  }

  // Regla 5 — No dejar console.log de debug (console.error/warn están OK
  // para logging real de errores).
  lines.forEach((line, i) => {
    if (/console\.log\(/.test(line)) {
      violations.push({
        file: `${rel}:${i + 1}`,
        rule: "no-console-log",
        detail: "console.log de debug olvidado — usá console.error/warn si es logging real.",
      });
    }
  });

  // Regla 6 — Todo archivo bajo src/app/**/page.tsx protegido por rol debe
  // llamar a requireRole/requireAdmin (defensa en profundidad además del
  // proxy.ts): si el archivo vive bajo /admin, /editor o /client y no es un
  // layout, tiene que validar el rol explícitamente.
  const isRoleScopedPage =
    /^src\/app\/(admin|editor|client)\/.*\/page\.tsx$/.test(rel) ||
    /^src\/app\/(admin|editor|client)\/page\.tsx$/.test(rel);
  if (isRoleScopedPage && !/requireRole|requireAdmin/.test(content)) {
    violations.push({
      file: rel,
      rule: "page-must-check-role",
      detail: "Página bajo una ruta protegida sin requireRole()/requireAdmin() explícito.",
    });
  }
}

walk(SRC_DIR);

if (violations.length > 0) {
  console.error(`\n✗ check-rules.mjs encontró ${violations.length} violación(es):\n`);
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}\n    ${v.detail}`);
  }
  console.error("");
  process.exit(1);
} else {
  console.log("✓ check-rules.mjs: sin violaciones.");
  process.exit(0);
}
