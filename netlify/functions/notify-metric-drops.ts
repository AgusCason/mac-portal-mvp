import type { Config } from "@netlify/functions";
import { getSupabaseAdmin } from "./_lib/admin-clients";

/**
 * Cron Job (Netlify Scheduled Function) — corre una vez por día. Fase 3.4:
 * alertas de métricas. Compara la última lectura de `social_metrics` de cada
 * cuenta social contra el promedio de sus hasta 7 lecturas previas; si
 * "reach" o "followers" cae 30% o más, genera:
 *  - una fila en `metric_alerts` (para no repetir el mismo aviso al otro día)
 *  - una notificación interna a los admins (bandeja de Notificaciones +
 *    resumen en el dashboard)
 * Nunca avisa al cliente ni toma ninguna acción automática — es una señal
 * para que la agencia investigue (¿se pausó la pauta? ¿cambió el algoritmo?
 * ¿hubo un problema técnico de conexión?).
 */
const DROP_THRESHOLD = 0.3; // 30% o más de caída dispara la alerta
const MIN_BASELINE = { reach: 50, followers: 20 }; // evita ruido sobre bases casi en cero
const METRICS: { key: "reach" | "followers"; label: string }[] = [
  { key: "reach", label: "Alcance" },
  { key: "followers", label: "Seguidores" },
];

const handler = async () => {
  const supabase = getSupabaseAdmin();

  const { data: accounts, error: accountsError } = await supabase
    .from("social_accounts")
    .select("id, client_id, platform, display_name, clients(name)");

  if (accountsError) {
    console.error("[notify-metric-drops]", accountsError.message);
    return new Response("error", { status: 500 });
  }

  let checked = 0;
  let alertsCreated = 0;

  for (const account of accounts ?? []) {
    const { data: history, error: historyError } = await supabase
      .from("social_metrics")
      .select("metric_date, reach, followers")
      .eq("social_account_id", account.id)
      .order("metric_date", { ascending: false })
      .limit(8);

    if (historyError || !history || history.length < 4) continue; // no hay suficiente historial todavía
    checked += 1;

    const [latest, ...previous] = history;
    const clientName = (account.clients as unknown as { name: string } | null)?.name ?? "—";

    for (const metric of METRICS) {
      const currentValue = latest[metric.key] ?? 0;
      const previousValues = previous.map((row) => row[metric.key] ?? 0);
      const previousAvg =
        previousValues.reduce((sum, v) => sum + v, 0) / (previousValues.length || 1);

      if (previousAvg < MIN_BASELINE[metric.key]) continue;

      const dropPct = (previousAvg - currentValue) / previousAvg;
      if (dropPct < DROP_THRESHOLD) continue;

      // ¿Ya avisamos de esta caída puntual? (mismo día + misma cuenta + misma métrica)
      const { data: existing } = await supabase
        .from("metric_alerts")
        .select("id")
        .eq("social_account_id", account.id)
        .eq("metric_date", latest.metric_date)
        .eq("metric_type", metric.key)
        .maybeSingle();

      if (existing) continue;

      const { error: insertError } = await supabase.from("metric_alerts").insert({
        social_account_id: account.id,
        client_id: account.client_id,
        metric_date: latest.metric_date,
        metric_type: metric.key,
        previous_avg: previousAvg,
        current_value: currentValue,
        drop_pct: dropPct,
      });
      if (insertError) {
        console.error("[notify-metric-drops] insert:", insertError.message);
        continue;
      }

      alertsCreated += 1;
      await supabase.rpc("notify_admins", {
        p_title: `${metric.label} en caída — ${clientName}`,
        p_body: `${account.platform} (${account.display_name ?? "cuenta"}) bajó ${Math.round(dropPct * 100)}% vs el promedio de los días previos.`,
        p_link: "/admin/redes",
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, checked, alertsCreated }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export default handler;

export const config: Config = {
  schedule: "0 14 * * *",
};
