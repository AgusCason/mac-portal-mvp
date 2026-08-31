"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { getClientDetail } from "@/lib/queries/clients";
import { getModuleFlags } from "@/lib/queries/module-flags";
import { getClientModuleOverrides } from "@/lib/queries/client-module-overrides";
import { mergeClientOverrides } from "@/lib/module-visibility";
import { isModuleVisible } from "@/lib/module-visibility";
import { runPortalAssistantTurn, type PortalAssistantMessage } from "@/lib/ai/portal-assistant";

const CLIENT_PORTAL_MODULE_KEYS = [
  "calendario",
  "drive",
  "contratos",
  "reportes-ia",
  "planes-facturacion",
  "sitios-web",
  "chat",
] as const;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const askSchema = z.object({
  history: z.array(messageSchema).max(20),
  message: z.string().min(1, "El mensaje no puede estar vacío").max(1000),
});

export type AskPortalAssistantResult = { ok: true; reply: string } | { ok: false; error: string };

/**
 * Botón flotante "Asistente" del Portal de Clientes — a diferencia del
 * Asistente IA del admin (MAX, con acceso real a datos y acciones), este
 * SOLO explica cómo usar la interfaz del portal. Sin tools, sin persistencia
 * en base — el historial vive nomás en el estado del componente del browser,
 * por eso viaja completo en cada llamada.
 */
export async function askPortalAssistantAction(
  historyInput: PortalAssistantMessage[],
  message: string
): Promise<AskPortalAssistantResult> {
  const profile = await requireRole(["client"]);

  const parsed = askSchema.safeParse({ history: historyInput, message });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Mensaje inválido" };
  }

  // Recalculamos qué secciones ve ESTE cliente de verdad (module_flags +
  // overrides puntuales) en vez de confiar en lo que mande el browser — así
  // el asistente nunca "explica" una sección que este cliente no tiene.
  const clientId = await getPrimaryClientId(profile.id);
  const [flags, overrides, detail] = await Promise.all([
    getModuleFlags(),
    clientId ? getClientModuleOverrides(clientId) : Promise.resolve({}),
    clientId ? getClientDetail(clientId) : Promise.resolve(null),
  ]);
  const effectiveFlags = mergeClientOverrides(flags, overrides);
  const visibleSectionKeys = [
    "dashboard",
    ...CLIENT_PORTAL_MODULE_KEYS.filter((key) => isModuleVisible(effectiveFlags[key], "client")),
  ];

  const clientName = detail?.client.brand_name || detail?.client.name || profile.full_name || "el cliente";

  try {
    const reply = await runPortalAssistantTurn(
      clientName,
      profile.language,
      visibleSectionKeys,
      parsed.data.history,
      parsed.data.message
    );
    return { ok: true, reply };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error inesperado llamando al asistente.",
    };
  }
}
