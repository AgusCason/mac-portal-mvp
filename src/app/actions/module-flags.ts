"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const FIELDS = ["enabled", "visible_to_editor", "visible_to_client"] as const;

const updateSchema = z.object({
  key: z.string().min(1),
  field: z.enum(FIELDS),
  value: z.boolean(),
});

/**
 * Panel Configuración > Módulos — toggles reales de "Activo globalmente",
 * "Visible para Editor" y "Visible para Cliente" por módulo. Solo admin.
 * `enabled=false` es un kill-switch: apaga el módulo para todos los roles,
 * incluido admin (lo hacen cumplir app-shell.tsx y proxy.ts).
 */
export async function updateModuleFlagAction(
  key: string,
  field: (typeof FIELDS)[number],
  value: boolean
) {
  const admin = await requireRole(["admin"]);
  const parsed = updateSchema.safeParse({ key, field, value });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const patch =
    parsed.data.field === "enabled"
      ? { enabled: parsed.data.value }
      : parsed.data.field === "visible_to_editor"
        ? { visible_to_editor: parsed.data.value }
        : { visible_to_client: parsed.data.value };
  const { error } = await supabase
    .from("module_flags")
    .update({ ...patch, updated_by: admin.id })
    .eq("key", parsed.data.key);

  if (error) return { ok: false, error: error.message };
  // Afecta el sidebar y el acceso a rutas de los 3 roles a la vez.
  revalidatePath("/", "layout");
  return { ok: true };
}
