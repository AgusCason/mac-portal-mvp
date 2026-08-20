"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

const inviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(["editor", "client"]),
});

/**
 * Invita a un nuevo usuario (editor o cliente) por email usando la
 * Admin API de Supabase (Service Role Key). El trigger `handle_new_user`
 * crea automáticamente su fila en `profiles` con el rol indicado en
 * `user_metadata.role`. El usuario recibe un email para setear su
 * contraseña y activar la cuenta.
 */
export async function inviteUserAction(formData: FormData) {
  await requireAdmin();

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { full_name: parsed.data.fullName, role: parsed.data.role satisfies UserRole },
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/equipo");
  revalidatePath("/admin/clientes");
  return { ok: true };
}
