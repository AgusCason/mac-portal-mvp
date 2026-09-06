import type { Config } from "@netlify/functions";
import { getSupabaseAdmin } from "./_lib/admin-clients";
import {
  getInstagramAccountDailyMetrics,
  getRecentInstagramMedia,
  getInstagramMediaMetrics,
} from "../../src/lib/meta";

/**
 * Cron diario — trae métricas reales de Instagram para cada cuenta conectada
 * (ver /api/oauth/meta/callback) y las guarda en:
 *  - `social_metrics`: un agregado por día y por cuenta (alimenta
 *    `getClientMetricsSummary`, los Reportes con IA, y `notify-metric-drops`).
 *  - `social_media_posts`: una fila por publicación real con sus propias
 *    métricas (alimenta la nueva tool `get_client_social_metrics` del
 *    Asistente IA, para poder proponer ideas de contenido basadas en qué
 *    funcionó mejor).
 *
 * El token de cada cuenta está cifrado (`access_token_encrypted`, ver 0038 /
 * 0039) — esta función corre con la Service Role Key sin ninguna sesión de
 * usuario, así que las funciones SQL `social_account_*_token` aceptan
 * explícitamente `auth.role() = 'service_role'` además de un admin logueado.
 */
const handler = async () => {
  const supabase = getSupabaseAdmin();
  const passphrase = process.env.META_TOKEN_ENCRYPTION_KEY || process.env.VAULT_ENCRYPTION_KEY;

  if (!passphrase) {
    console.error("[sync-social-metrics] Falta META_TOKEN_ENCRYPTION_KEY / VAULT_ENCRYPTION_KEY.");
    return new Response("no encryption key configured", { status: 500 });
  }

  const { data: accounts, error: accountsError } = await supabase
    .from("social_accounts")
    .select("id, external_account_id, access_token_encrypted")
    .eq("platform", "instagram")
    .not("access_token_encrypted", "is", null);

  if (accountsError) {
    console.error("[sync-social-metrics]", accountsError.message);
    return new Response("error", { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  let accountsSynced = 0;
  let postsSynced = 0;
  let errors = 0;

  for (const account of accounts ?? []) {
    const { data: token, error: tokenError } = await supabase.rpc("social_account_reveal_token", {
      p_id: account.id,
      p_passphrase: passphrase,
    });
    if (tokenError || !token) {
      console.warn(`[sync-social-metrics] no se pudo descifrar el token de ${account.id}:`, tokenError?.message);
      errors += 1;
      continue;
    }

    try {
      // Baseline de ayer — si algún metric de hoy falla en pedirse (Meta
      // deprecó/renombró algo), preferimos arrastrar el último valor
      // conocido antes que escribir un 0 falso: `notify-metric-drops`
      // interpretaría eso como una caída real y dispararía una alerta
      // fantasma.
      const { data: previousMetric } = await supabase
        .from("social_metrics")
        .select("reach, followers, impressions")
        .eq("social_account_id", account.id)
        .lt("metric_date", today)
        .order("metric_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const [accountMetrics, mediaResult] = await Promise.all([
        getInstagramAccountDailyMetrics(account.external_account_id, token),
        getRecentInstagramMedia(account.external_account_id, token, 25),
      ]);

      let dayLikes = 0;
      let dayComments = 0;
      let daySaved = 0;
      let dayPlays = 0;
      let dayReachSum = 0;
      let postsToday = 0;

      if (mediaResult.ok) {
        // Secuencial a propósito (no Promise.all): son hasta 25 llamadas más
        // por cuenta a la API de Meta, y este job ya corre una vez por día
        // sin apuro — ráfagas grandes son justo lo que dispara rate limiting.
        for (const media of mediaResult.data) {
          const metrics = await getInstagramMediaMetrics(media.id, media.mediaType, token);
          const likes = media.likeCount ?? 0;
          const comments = media.commentsCount ?? 0;
          const saved = metrics.saved ?? 0;
          const plays = metrics.plays ?? 0;
          const reach = metrics.reach ?? 0;
          const engagementRate = reach > 0 ? ((likes + comments + saved) / reach) * 100 : 0;

          const { error: upsertPostError } = await supabase.from("social_media_posts").upsert(
            {
              social_account_id: account.id,
              external_post_id: media.id,
              media_type: media.mediaType,
              permalink: media.permalink,
              thumbnail_url: media.thumbnailUrl,
              // Las captions pueden ser largas — recortada, no hace falta el
              // texto completo para lo que se usa (reportes, sugerencias).
              caption: media.caption?.slice(0, 2000) ?? null,
              posted_at: media.timestamp,
              reach,
              likes,
              comments,
              saved,
              plays,
              engagement_rate: Number(engagementRate.toFixed(3)),
              synced_at: new Date().toISOString(),
            },
            { onConflict: "social_account_id,external_post_id" }
          );

          if (upsertPostError) {
            console.error(`[sync-social-metrics] post ${media.id}:`, upsertPostError.message);
            continue;
          }
          postsSynced += 1;

          // Solo lo publicado HOY entra al agregado diario de la cuenta —
          // `social_metrics` es una foto por día, no un acumulado de todo lo
          // que existe.
          if (media.timestamp?.slice(0, 10) === today) {
            dayLikes += likes;
            dayComments += comments;
            daySaved += saved;
            dayPlays += plays;
            dayReachSum += reach;
            postsToday += 1;
          }
        }
      } else {
        console.warn(`[sync-social-metrics] media de ${account.id}:`, mediaResult.error);
      }

      const reach = accountMetrics.reach ?? (postsToday > 0 ? dayReachSum : (previousMetric?.reach ?? 0));
      const followers = accountMetrics.followers ?? previousMetric?.followers ?? 0;
      const impressions = accountMetrics.impressions ?? previousMetric?.impressions ?? 0;
      const engagementRate = reach > 0 ? ((dayLikes + dayComments + daySaved) / reach) * 100 : 0;

      const { error: metricsError } = await supabase.from("social_metrics").upsert(
        {
          social_account_id: account.id,
          metric_date: today,
          reach,
          impressions,
          followers,
          plays: dayPlays,
          engagement_rate: Number(engagementRate.toFixed(3)),
        },
        { onConflict: "social_account_id,metric_date" }
      );

      if (metricsError) {
        console.error(`[sync-social-metrics] social_metrics ${account.id}:`, metricsError.message);
        errors += 1;
        continue;
      }

      accountsSynced += 1;
    } catch (err) {
      console.error(`[sync-social-metrics] cuenta ${account.id}:`, err instanceof Error ? err.message : err);
      errors += 1;
    }
  }

  return new Response(JSON.stringify({ ok: true, accountsSynced, postsSynced, errors }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export default handler;

export const config: Config = {
  schedule: "0 7 * * *",
};
