import type { Config } from "@netlify/functions";
import { getSupabaseAdmin } from "./_lib/admin-clients";
import { sendWhatsAppMessage } from "../../src/lib/whatsapp";

/**
 * Cron Job (Netlify Scheduled Function) — corre una vez por día. Implementa
 * la "automatización de morosidad" del módulo de facturación:
 *  - Días 1-7 de atraso: recordatorio automático por WhatsApp al cliente.
 *  - Día 15+: alerta interna a la agencia sugiriendo evaluar un bloqueo —
 *    el bloqueo NUNCA es automático, siempre lo decide el admin a mano
 *    desde /admin/clientes (`updateClientStatusAction`).
 * También pasa a "overdue" cualquier factura "pending" cuyo `due_date` ya
 * pasó, para que el resto de la UI (badge de estado) refleje la realidad.
 */
const handler = async () => {
  const supabase = getSupabaseAdmin();
  const todayIso = new Date().toISOString().slice(0, 10);

  await supabase
    .from("billing_invoices")
    .update({ status: "overdue" })
    .eq("status", "pending")
    .lt("due_date", todayIso);

  const { data: invoices, error } = await supabase
    .from("billing_invoices")
    .select("id, client_id, amount, currency, due_date, delinquency_alert_sent_at, clients(name, contact_phone)")
    .eq("status", "overdue");

  if (error) {
    console.error("[notify-delinquent-invoices]", error.message);
    return new Response("error", { status: 500 });
  }

  const agencyPhone = process.env.AGENCY_WHATSAPP_NUMBER;
  let remindersSent = 0;
  let alertsSent = 0;

  for (const invoice of invoices ?? []) {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(invoice.due_date + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24)
    );
    const client = invoice.clients as unknown as { name: string; contact_phone: string | null } | null;

    if (daysOverdue >= 1 && daysOverdue <= 7 && client?.contact_phone) {
      const result = await sendWhatsAppMessage(
        client.contact_phone,
        `Hola${client.name ? ` ${client.name}` : ""}, te recordamos que tenés un pago pendiente de ${invoice.amount} ${invoice.currency} desde el ${invoice.due_date}. Cualquier consulta, respondé este mensaje.`
      );
      if (result.ok) {
        remindersSent += 1;
        await supabase.from("chat_messages").insert({
          client_id: invoice.client_id,
          direction: "outbound",
          body: `[Automático] Recordatorio de pago pendiente (${daysOverdue}d de atraso).`,
          whatsapp_message_id: result.messageId || null,
        });
      }
      continue;
    }

    if (daysOverdue >= 15 && !invoice.delinquency_alert_sent_at && agencyPhone) {
      const result = await sendWhatsAppMessage(
        agencyPhone,
        `⚠️ Cliente moroso: "${client?.name ?? "—"}" tiene ${daysOverdue} días de atraso (${invoice.amount} ${invoice.currency}). Evaluá si corresponde pausar la cuenta desde el panel — la decisión es manual.`
      );
      if (result.ok) {
        alertsSent += 1;
        await supabase
          .from("billing_invoices")
          .update({ delinquency_alert_sent_at: new Date().toISOString() })
          .eq("id", invoice.id);
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, checked: invoices?.length ?? 0, remindersSent, alertsSent }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

export default handler;

export const config: Config = {
  schedule: "0 13 * * *",
};
