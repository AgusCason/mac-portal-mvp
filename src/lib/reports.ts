import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import PDFDocument from "pdfkit";
import type { PlatformMetricsSummary, ClientPostMetric } from "@/lib/queries/social";

let _client: Anthropic | null = null;
function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY (ver .env.example).");
  }
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const REPORT_SYSTEM_PROMPT = `Sos un analista senior de redes sociales de una agencia de contenido, redactando el resumen ejecutivo de un reporte de performance para un cliente.

Reglas:
- Español rioplatense, profesional pero cercano — es un reporte que el cliente va a leer, no un chat interno.
- Estructurá la respuesta en secciones. Cada sección empieza con una línea que dice "## Título de la sección" seguida del texto en párrafos normales (sin markdown, sin bullets con guiones ni asteriscos).
- Usá estas secciones, en este orden: "Resumen General", "Contenido Publicado", "Métricas por Red", "Recomendaciones".
- Nunca inventes cifras que no te dieron. Si falta información de alguna red (sin cuentas conectadas, sin datos cargados), decilo explícitamente en vez de estimar o rellenar.
- Si te dieron publicaciones puntuales de mejor y peor rendimiento, usalas: en "Contenido Publicado" nombrá qué piezas se destacaron y por qué (formato, tema), y en "Recomendaciones" basate en esa comparación real (qué repetir, qué evitar) en vez de dar consejos genéricos de redes sociales.
- Sé concreto: 2-4 párrafos cortos por sección, no un ensayo.`;

export interface ReportContext {
  clientName: string;
  planName: string | null;
  periodLabel: string;
  publishedPieces: { title: string; network: string }[];
  metrics: PlatformMetricsSummary[];
  topPosts?: ClientPostMetric[];
  bottomPosts?: ClientPostMetric[];
}

function formatPost(p: ClientPostMetric): string {
  const label = p.caption ? p.caption.slice(0, 80).replace(/\s+/g, " ") : "(sin descripción)";
  return `- [${p.platform}${p.mediaType ? `/${p.mediaType}` : ""}] "${label}" — alcance ${p.reach}, likes ${p.likes}, comentarios ${p.comments}, guardados ${p.saved}${p.plays ? `, reproducciones ${p.plays}` : ""}, engagement ${p.engagementRate.toFixed(2)}%`;
}

/**
 * Le pide a Claude el resumen ejecutivo del período, a partir de datos ya
 * recolectados (nunca le damos acceso a tools acá — a diferencia del
 * Asistente IA de `lib/ai/client.ts`, este es un llamado de una sola pasada
 * con todo el contexto ya armado, pensado para texto largo estructurado).
 */
export async function generateReportSummary(ctx: ReportContext): Promise<string> {
  const anthropic = getAnthropicClient();

  const metricsBlock =
    ctx.metrics.length === 0
      ? "(sin cuentas sociales conectadas, o sin métricas cargadas en este período)"
      : ctx.metrics
          .map(
            (m) =>
              `- ${m.platform}${m.displayName ? ` (${m.displayName})` : ""}: alcance total ${m.totalReach}, impresiones ${m.totalImpressions}, engagement promedio ${m.avgEngagementRate.toFixed(2)}%, reproducciones ${m.totalPlays}, seguidores actuales ${m.followers ?? "—"} (${m.daysWithData} días con datos cargados en el período)`
          )
          .join("\n");

  const prompt = `Cliente: ${ctx.clientName}
Plan: ${ctx.planName ?? "sin plan asignado"}
Período del reporte: ${ctx.periodLabel}

Piezas publicadas en el período (${ctx.publishedPieces.length} en total):
${ctx.publishedPieces.map((p) => `- ${p.title} (${p.network})`).join("\n") || "(ninguna pieza publicada en este período)"}

Métricas por red social:
${metricsBlock}

Publicaciones de mejor rendimiento en el período:
${ctx.topPosts && ctx.topPosts.length > 0 ? ctx.topPosts.map(formatPost).join("\n") : "(sin datos de publicaciones individuales todavía)"}

Publicaciones de peor rendimiento en el período:
${ctx.bottomPosts && ctx.bottomPosts.length > 0 ? ctx.bottomPosts.map(formatPost).join("\n") : "(sin datos de publicaciones individuales todavía)"}

Redactá el resumen ejecutivo de este período para el cliente, siguiendo la estructura de secciones indicada.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1536,
    system: REPORT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/**
 * Arma el PDF final a partir del texto estructurado de Claude (secciones
 * marcadas con "## Título"). `pdfkit` genera el PDF en memoria como stream
 * de buffers — no toca el filesystem, así que corre bien dentro de un
 * Server Action serverless (ver `serverExternalPackages` en next.config.ts
 * para que sus fuentes .afm viajen intactas al deploy de Netlify).
 */
export function buildReportPdf(params: {
  title: string;
  clientName: string;
  periodLabel: string;
  generatedAt: Date;
  summary: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).fillColor("#111111").text(params.title);
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#666666");
    doc.text(params.clientName);
    doc.text(params.periodLabel);
    doc.text(`Generado el ${params.generatedAt.toLocaleDateString("es-AR")}`);
    doc.moveDown(1.5);
    doc.fillColor("#111111");

    const sections = params.summary.split(/\n(?=##\s)/g).filter(Boolean);
    if (sections.length === 0) {
      doc.fontSize(11).text(params.summary || "(sin contenido)", { align: "justify" });
    }
    for (const section of sections) {
      const match = section.match(/^##\s*(.+?)\n([\s\S]*)$/);
      if (match) {
        doc.fontSize(14).text(match[1].trim());
        doc.moveDown(0.4);
        doc.fontSize(11).text(match[2].trim(), { align: "justify" });
      } else {
        doc.fontSize(11).text(section.trim(), { align: "justify" });
      }
      doc.moveDown(1);
    }

    doc.end();
  });
}
