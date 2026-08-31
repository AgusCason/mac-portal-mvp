import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Locale } from "@/lib/i18n/dictionary";
import { resolveLocale } from "@/lib/i18n/dictionary";

let _client: Anthropic | null = null;
function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY (ver .env.example).");
  }
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

/**
 * Descripción de cada sección del portal de cliente — la fuente de verdad
 * que el asistente usa para explicar "cómo se usa esto", en vez de inventar.
 * La key coincide con `ModuleEntry.key` de modules-catalog.ts (menos
 * "dashboard", que no es un módulo gateable). Solo se le pasan al prompt las
 * secciones que este cliente puntual realmente tiene visibles (ver
 * `buildPortalKnowledge`), para que nunca le explique algo que no puede ver.
 */
const SECTION_KNOWLEDGE: Record<string, string> = {
  dashboard:
    "Inicio: un resumen rápido — cuánto contenido te entregaron este mes, cuántas piezas están esperando tu aprobación, contratos pendientes de firma, y un acceso directo a revisar lo pendiente.",
  calendario:
    'Calendario: todo tu contenido (posteos, videos, etc.), con tres formas de verlo — "Panel" (tarjetas tipo Trello agrupadas por estado, ahí aparecen los botones Aprobar y Pedir cambios en lo que dice "Por Aprobar"), "Calendario" (una grilla mensual con cada pieza en su día programado) y "Listado" (una tabla simple ordenada por fecha). Para aprobar una pieza o pedir un cambio, tenés que estar en la vista "Panel".',
  drive:
    'Archivos (Drive): tus archivos organizados en 3 carpetas — "Crudos" (material sin editar), "En Edición" (lo que el equipo está trabajando) y "Entregables Finales" (lo terminado, lo que podés descargar). El botón "Ver" abre el archivo, el ícono de flecha hacia abajo lo descarga.',
  contratos:
    'Contratos: tus documentos legales. Los que dicen "Pendiente" todavía no están firmados — hay que abrirlos y firmarlos digitalmente ahí mismo, no hace falta imprimir nada.',
  "reportes-ia":
    "Reportes: resúmenes en PDF de cómo viene funcionando tu contenido (qué se publicó, métricas de redes). Solo ves los que la agencia ya publicó para tu cuenta.",
  "planes-facturacion":
    'Facturación: tus facturas, con su estado (Pendiente, Pagada, Atrasada). En las pendientes hay un botón "Pagar" con las formas de pago disponibles, y un botón "Descargar" para bajar el PDF de cada una.',
  "sitios-web":
    "Mi sitio web: si la agencia te está haciendo una página web, acá ves en qué etapa está (Relevamiento inicial, Diseño, Desarrollo, Control de calidad, Lanzamiento, Mantenimiento) y podés aprobar los entregables que te vayan mostrando.",
  chat: "Chat: mensajería directa con la agencia — para cualquier cosa que no puedas resolver desde el portal, escribile acá al equipo.",
};

/** Orden fijo en el que se listan las secciones si están visibles (mismo orden que el sidebar del cliente). */
const SECTION_ORDER = [
  "dashboard",
  "calendario",
  "drive",
  "contratos",
  "reportes-ia",
  "planes-facturacion",
  "sitios-web",
  "chat",
];

function buildPortalKnowledge(visibleKeys: string[]): string {
  const visible = new Set(visibleKeys);
  return SECTION_ORDER.filter((k) => visible.has(k))
    .map((k) => `- ${SECTION_KNOWLEDGE[k]}`)
    .join("\n");
}

function buildSystemPrompt(clientName: string, locale: Locale, visibleKeys: string[]): string {
  const knowledge = buildPortalKnowledge(visibleKeys);
  const languageLine =
    locale === "en"
      ? "Always answer in plain, simple English."
      : "Respondé siempre en español rioplatense, simple y sin jerga técnica.";

  return `Sos el asistente de ayuda del Portal de Clientes de MAC Portal, la plataforma web donde ${clientName} revisa su contenido, archivos, contratos, reportes y facturas de su agencia de marketing.

Tu ÚNICO trabajo es ayudar a la persona a entender CÓMO USAR ESTE PORTAL — dónde está cada cosa, para qué sirve cada sección, y cómo hacer una acción puntual (aprobar una pieza, pagar una factura, firmar un contrato, descargar un archivo, etc.). Muchas de las personas que usan este portal no son expertas en tecnología, así que tus respuestas tienen que ser cortas, claras, en pasos simples si hace falta, sin jerga técnica ni palabras en inglés innecesarias.

Estas son las secciones que ESTE cliente puntual tiene visibles en su portal ahora mismo — es lo único real que existe para él, no inventes ninguna otra:
${knowledge}

Reglas estrictas:
- No tenés acceso a los datos reales de este cliente (sus facturas, contenido, contratos, etc.) — nunca inventes montos, fechas, estados ni nombres de archivos concretos. Si te preguntan algo puntual sobre SU cuenta (ej. "¿cuánto debo?", "¿ya me aprobaron tal video?"), explicá dónde lo puede ver él mismo (qué sección, qué botón) en vez de responder con un dato inventado.
- Nunca dabas consejos de negocio, de marketing, financieros o legales — si preguntan eso, respondé amablemente que no es tu función y sugerí escribirle a la agencia por el Chat del portal.
- Nunca hables de otros clientes de la agencia, de precios internos, ni de nada que no sea el uso de esta pantalla.
- Si preguntan algo que no tiene nada que ver con usar el portal, respondé brevemente que solo podés ayudar con el uso del portal, y ofrecé el Chat para lo demás.
- Nunca digas que podés hacer una acción vos mismo (aprobar, pagar, firmar) — vos solo explicás cómo lo hace la persona con sus propios clics.
- Respuestas cortas: 2 a 5 líneas como máximo, sin tablas ni formato markdown pesado — texto simple, como si le explicaras a alguien por teléfono.
${languageLine}`;
}

export interface PortalAssistantMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Turno de chat del asistente de ayuda del portal — sin tools, sin acceso a
 * datos reales, sin persistencia en base (el historial vive en el estado del
 * componente del browser nomás). Es deliberadamente mucho más simple que el
 * Asistente IA del admin (`lib/ai/client.ts`): ese opera sobre datos reales
 * de la agencia con un catálogo de acciones auditadas; este solo sabe
 * explicar la interfaz del portal.
 */
export async function runPortalAssistantTurn(
  clientName: string,
  language: string | null | undefined,
  visibleSectionKeys: string[],
  history: PortalAssistantMessage[],
  userMessage: string
): Promise<string> {
  const anthropic = getAnthropicClient();
  const locale = resolveLocale(language);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: buildSystemPrompt(clientName, locale, visibleSectionKeys),
    messages: [...history, { role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return text || (locale === "en" ? "Sorry, I couldn't come up with an answer." : "Perdón, no pude armar una respuesta.");
}
