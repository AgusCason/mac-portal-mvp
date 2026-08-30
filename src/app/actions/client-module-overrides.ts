"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  clientId: z.string().uuid(),
  moduleKey: z.string().min(1),
  value: z.boolean().nullable(),
});

/**
 * Ficha de cliente > pestaña Accesos — da o saca acceso a un módulo del
 * Portal de Clientes para ESTE cliente puntual, sin tocar Configuración >
 * Módulos (que sigue gobernando el on/off general de la plataforma).
 * `value: null` borra el override y vuelve a "como agencia" (hereda el
 * `visible_to_client` general). Solo admin.
 */
export async function updateClientModuleAccessAction(
  clientId: string,
  moduleKey: string,
  value: boolean | null
) {
  const admin = await requireAdmin();
  const parsed = updateSchema.safeParse({ clientId, moduleKey, value });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();

  if (parsed.data.value === null) {
    const { error } = await supabase
      .from("client_module_overrides")
      .delete()
      .eq("client_id", parsed.data.clientId)
      .eq("module_key", parsed.data.moduleKey);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("client_module_overrides").upsert(
      {
        client_id: parsed.data.clientId,
        module_key: parsed.data.moduleKey,
        visible: parsed.data.value,
        updated_by: admin.id,
      },
      { onConflict: "client_id,module_key" }
    );
    if (error) return { ok: false, error: error.message };
  }

  // La ficha del cliente (esta pestaña) y el sidebar/rutas de ESE cliente
  // (proxy.ts cachea 30s, layout.tsx no cachea) — revalidar todo el layout
  // es la forma simple de que el cambio se vea sin esperar el TTL de proxy.
  revalidatePath(`/admin/clientes/${parsed.data.clientId}`);
  revalidatePath("/", "layout");
  return { ok: true };
}
