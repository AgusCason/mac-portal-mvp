import type { Config } from "@netlify/functions";
import { getSupabaseAdmin } from "./_lib/admin-clients";
import { sendWhatsAppMessage } from "../../src/lib/whatsapp";

/**
 * Cron Job (Netlify Scheduled Function) — corre cada 2 horas. Es la capa de
 * "análisis constante" de seguridad que pidió el admin: no bloquea nada por
 * sí sola (eso ya lo hace `check_rate_limit()` en tiempo real — ver
 * 0027_security_hardening.sql), sino que junta en un solo aviso por
 * WhatsApp lo que pasó en las últimas horas, para no generar ruido por cada
 * bloqueo individual:
 *  - Cuántos bloqueos automáticos temporales se dispararon (rate limit
 *    superado en login, webhook de WhatsApp, o formularios públicos) y
 *    cuáles keys concentran más bloqueos (mismo IP/email atacado varias veces).
 *  - Anomalías en la Bóveda: un mismo admin revelando credenciales muchas
 *    veces seguidas puede ser normal (día de rotación de contraseñas) o
 *    puede ser una sesión comprometida — se marca para que lo mires, nunca
 *    se bloquea solo (revocar acceso de un admin es demasiado drástico para
 *    hacerlo automático).
 * Si no hay nada fuera de lo normal, no manda ningún mensaje — un aviso
 * "todo tranquilo" todos los días termina ignorándose igual que uno real.
 */
const WINDOW_HOURS = 3; // se solapa con el intervalo del cron (2hs) para no perder eventos por timing
const VAULT_REVEAL_THRESHOLD = 8; // reveals de un mismo actor en la ventana que ameritan mirar

const handler = async () => {
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const findings: string[] = [];

  const { data: blocks, error: blocksError } = await supabase
    .from("security_blocks")
    .select("block_key, reason, created_at")
    .gte("created_at", since);

  if (blocksError) {
    console.error("[security-monitor] security_blocks:", blocksError.message);
  } else if (blocks && blocks.length > 0) {
    const byKey = new Map<string, number>();
    for (const b of blocks) byKey.set(b.block_key, (byKey.get(b.block_key) ?? 0) + 1);
    const top = Array.from(byKey.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => `${key} (${count}x)`)
      .join(", ");
    findings.push(
      `${blocks.length} bloqueo(s) automático(s) temporal(es) en las últimas ${WINDOW_HOURS}hs. Más repetidos: ${top}.`
    );
  }

  const { data: reveals, error: revealsError } = await supabase
    .from("audit_log")
    .select("actor_id, profiles(full_name, email)")
    .eq("action_type", "vault.credential_revealed")
    .gte("created_at", since);

  if (revealsError) {
    console.error("[security-monitor] audit_log reveals:", revealsError.message);
  } else if (reveals && reveals.length > 0) {
    const byActor = new Map<string, number>();
    for (const r of reveals) {
      const key = r.actor_id ?? "desconocido";
      byActor.set(key, (byActor.get(key) ?? 0) + 1);
    }
    for (const [actorId, count] of byActor.entries()) {
      if (count < VAULT_REVEAL_THRESHOLD) continue;
      const row = reveals.find((r) => (r.actor_id ?? "desconocido") === actorId);
      const actorProfile = row?.profiles as unknown as { full_name: string | null; email: string } | null;
      const actorLabel = actorProfile?.full_name || actorProfile?.email || actorId;
      findings.push(
        `${actorLabel} reveló ${count} credenciales de la Bóveda en las últimas ${WINDOW_HOURS}hs — revisá si es esperado.`
      );
    }
  }

  if (findings.length === 0) {
    return new Response(JSON.stringify({ ok: true, alerted: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const message = `🔒 Monitoreo de seguridad — ${findings.length} cosa(s) para revisar:\n\n${findings
    .map((f, i) => `${i + 1}. ${f}`)
    .join("\n")}\n\nRevisá el detalle en Configuración > Auditoría.`;

  const agencyPhone = process.env.AGENCY_WHATSAPP_NUMBER;
  if (agencyPhone) {
    const result = await sendWhatsAppMessage(agencyPhone, message);
    if (!result.ok) console.error("[security-monitor] WhatsApp:", result.error);
  } else {
    console.warn("[security-monitor] AGENCY_WHATSAPP_NUMBER no configurado — no se pudo avisar por WhatsApp.");
  }

  await supabase.rpc("log_audit", {
    p_action_type: "security.alert",
    p_target_table: "security_blocks",
    p_target_id: null,
    p_summary: `Monitoreo de seguridad: ${findings.length} hallazgo(s) en las últimas ${WINDOW_HOURS}hs.`,
    p_client_id: null,
    p_diff: { findings },
  });

  return new Response(JSON.stringify({ ok: true, alerted: true, findings }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export default handler;

export const config: Config = {
  schedule: "0 */2 * * *",
};
