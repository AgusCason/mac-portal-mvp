import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;
function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY (ver .env.example).");
  }
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const BRAND_VOICE_SYSTEM_PROMPT = `Sos un estratega de marca de una agencia de contenido, ayudando a redactar la ficha de "Brand Voice" (tono de marca) de una cuenta de cliente.

Reglas:
- Español rioplatense, tono profesional.
- Te piden un borrador para UN SOLO campo puntual de la ficha (te lo indican). Respondé SOLO con el texto de ese campo — sin encabezados, sin explicaciones, sin comillas.
- 2-4 oraciones concretas y accionables, nunca genéricas ("tono cercano y profesional" sin más — dale algo específico a esta marca).
- Si no tenés suficiente contexto del cliente, igual proponé un borrador razonable basado en el nombre/rubro, aclarando entre paréntesis que es una primera propuesta a ajustar.`;

const FIELD_LABEL: Record<string, string> = {
  tone_personality: "Tono y Personalidad",
  vocabulary: "Vocabulario (palabras a usar / evitar)",
  emoji_rules: "Reglas de Emojis y Formato",
  target_audience: "Audiencia Objetivo",
  platform_settings: "Ajustes por Plataforma (diferencias de tono entre Instagram/TikTok/YouTube)",
};

/**
 * "AI AGENT" de Brand Voice (equivalente al panel lateral de MB Suite):
 * sugiere un borrador para un campo puntual de la ficha, a partir del
 * nombre del cliente. Nunca guarda nada solo — el admin decide si lo usa.
 */
export async function generateBrandVoiceSuggestion(
  clientName: string,
  field: keyof typeof FIELD_LABEL
): Promise<string> {
  const anthropic = getAnthropicClient();
  const label = FIELD_LABEL[field] ?? field;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: BRAND_VOICE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Cliente: ${clientName}\nCampo a redactar: ${label}`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}
