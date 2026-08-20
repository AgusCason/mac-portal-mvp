import type { Config } from "@netlify/functions";
import { getSupabaseAdmin } from "./_lib/admin-clients";
import { sendWhatsAppMessage } from "../../src/lib/whatsapp";

/**
 * Cron Job (Netlify Scheduled Function) — corre cada 15 minutos y avisa a la
 * agencia por WhatsApp 30 minutos antes de que una pieza programada deba
 * publicarse, con: link de descarga HD, fecha/hora, caption lista para
 * copiar y un link directo al calendario del admin para marcarla como
 * publicada con un clic (el botón "Marcar como Publicado" real vive en el
 * portal — `ContentBoard` ya soporta la transición programado → publicado —
 * no se expone ninguna acción de escritura sin autenticación desde WhatsApp).
 */
const handler = async () => {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);

  const { data: items, error } = await supabase
    .from("content_items")
    .select("id, title, description, network, scheduled_at, drive_file_id, clients(name)")
    .eq("status", "programado")
    .is("publish_reminder_sent_at", null)
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", windowEnd.toISOString());

  if (error) {
    console.error("[notify-upcoming-publishes]", error.message);
    return new Response("error", { status: 500 });
  }

  const agencyPhone = process.env.AGENCY_WHATSAPP_NUMBER;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let sent = 0;

  for (const item of items ?? []) {
    const clientName = (item.clients as unknown as { name: string } | null)?.name ?? "—";
    const when = new Date(item.scheduled_at as string).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
    const downloadLink = item.drive_file_id
      ? `https://drive.google.com/uc?export=download&id=${item.drive_file_id}`
      : "(sin archivo entregado todavía)";

    const message = [
      `⏰ Publicación en 30 min: "${item.title}" (${clientName})`,
      `Hora: ${when}`,
      `Descarga HD: ${downloadLink}`,
      item.description ? `Caption: ${item.description}` : null,
      siteUrl ? `Marcar como publicado: ${siteUrl}/admin/calendario` : null,
    ]
      .filter(Boolean)
      .join("\n");

    if (!agencyPhone) {
      console.warn("[notify-upcoming-publishes] Falta AGENCY_WHATSAPP_NUMBER, no se pudo avisar.");
      continue;
    }

    const result = await sendWhatsAppMessage(agencyPhone, message);
    if (!result.ok) continue;

    sent += 1;
    // Solo marcamos el aviso como enviado si realmente salió — así, si
    // WhatsApp todavía no está configurado o falla, el próximo corrido (15
    // min después) reintenta en vez de perder el aviso silenciosamente.
    await supabase
      .from("content_items")
      .update({ publish_reminder_sent_at: now.toISOString() })
      .eq("id", item.id);
  }

  return new Response(JSON.stringify({ ok: true, checked: items?.length ?? 0, sent }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export default handler;

export const config: Config = {
  schedule: "*/15 * * * *",
};
