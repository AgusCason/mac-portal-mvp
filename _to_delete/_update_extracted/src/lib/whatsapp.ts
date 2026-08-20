import "server-only";

export type SendWhatsAppResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

/**
 * Envía un mensaje de texto libre por WhatsApp Cloud API (Meta). Setup:
 *  1. Meta for Developers > tu App > WhatsApp > API Setup.
 *  2. `WHATSAPP_PHONE_NUMBER_ID`: el "Phone number ID" del número emisor.
 *  3. `WHATSAPP_ACCESS_TOKEN`: token permanente de una System User con
 *     permiso `whatsapp_business_messaging` (los tokens de prueba expiran
 *     en 24hs — para producción generá uno permanente en Meta Business Suite).
 *
 * Nota: fuera de la ventana de 24hs de conversación con el destinatario,
 * WhatsApp exige usar una plantilla (template) pre-aprobada en vez de texto
 * libre — los mensajes salientes automáticos de este proyecto (recordatorio
 * de publicación, aviso de morosidad) están pensados para ese caso; si Meta
 * rechaza el mensaje de texto libre, el error queda logueado y hay que
 * reemplazar el `text` de abajo por un `template` aprobado (ver README).
 */
export async function sendWhatsAppMessage(
  toPhone: string,
  body: string
): Promise<SendWhatsAppResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      ok: false,
      error:
        "Faltan credenciales de WhatsApp Cloud API (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID).",
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toPhone.replace(/[^\d]/g, ""),
          type: "text",
          text: { body },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      const message = data?.error?.message ?? `WhatsApp respondió HTTP ${res.status}`;
      console.error("[sendWhatsAppMessage]", message);
      return { ok: false, error: message };
    }

    return { ok: true, messageId: data?.messages?.[0]?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de red enviando WhatsApp.";
    console.error("[sendWhatsAppMessage]", message);
    return { ok: false, error: message };
  }
}
