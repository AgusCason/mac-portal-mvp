import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, AiProposedAction, Profile } from "@/types/database";
import { READ_TOOLS, executeReadTool } from "@/lib/ai/tools";
import { ACTION_TYPES, isKnownActionType, previewAction } from "@/lib/ai/actions-registry";

type AdminClient = SupabaseClient<Database>;

let _client: Anthropic | null = null;
function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY (ver .env.example).");
  }
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const MAX_TOOL_ITERATIONS = 6;

const PROPOSE_CHANGE_TOOL: Anthropic.Tool = {
  name: "propose_change",
  description:
    "Registra una propuesta de cambio en los datos de la agencia PARA QUE UN HUMANO LA CONFIRME. Esto NUNCA ejecuta el cambio directamente — solo lo deja preparado con un resumen claro. Usar como ÚLTIMA acción del turno (no llamar otra tool después). Nunca inventes un target_id: primero usá list_clients/get_client_detail/find_data_issues para conseguir el id real.",
  input_schema: {
    type: "object",
    properties: {
      action_type: {
        type: "string",
        enum: ACTION_TYPES,
        description: "Qué tipo de cambio se propone (del catálogo cerrado de acciones seguras).",
      },
      target_id: {
        type: "string",
        description: "UUID real del registro a modificar (cliente, asignación o pieza de contenido, según action_type).",
      },
      summary: {
        type: "string",
        description: "Una frase clara en español explicando qué se va a cambiar y por qué, para mostrarle al admin.",
      },
      payload: {
        type: "object",
        description: "Los datos nuevos específicos de esa acción (ej: {status: 'active'} para update_client_status).",
      },
    },
    required: ["action_type", "target_id", "summary", "payload"],
  },
};

const SYSTEM_PROMPT = `Sos el asistente de operaciones de MAC Portal, un SaaS interno para que la agencia MAC gestione clientes, contenido, contratos y equipo.

Reglas:
- Respondés siempre en español rioplatense, corto y directo — el admin está trabajando, no le des rodeos.
- Solo tenés acceso a lo que las tools te devuelven. Nunca inventes nombres, ids, montos ni estados — si no los tenés, llamá a la tool correspondiente primero.
- Podés leer libremente con list_clients, get_client_detail, find_data_issues y get_client_social_metrics.
- Para CUALQUIER cambio en los datos (corregir un error, actualizar un estado, arreglar permisos, etc.) tenés que llamar a propose_change como último paso del turno. Vos NUNCA modificás datos directamente — el cambio solo se aplica si el admin lo confirma con un clic en la interfaz. No digas "listo, ya lo arreglé": decí "te dejo la propuesta lista para confirmar".
- Si el admin pide "revisar errores" o similar, usá find_data_issues, contale qué encontraste en una lista corta, y ofrecé proponer el arreglo de los que tengan solución automática conocida (los que traen suggested_action_type).
- Si el admin pregunta cómo le está yendo a un cliente en redes, pide ideas de contenido, o cómo mejorar resultados, usá get_client_social_metrics ANTES de opinar: comparar publicaciones reales de mejor y peor rendimiento (formato, tema, horario si se nota un patrón) es la base de cualquier propuesta — nunca des consejos genéricos de redes sociales sin haber mirado esos datos primero. Sé proactivo: si ya tenés las métricas de un cliente sobre la mesa (por ejemplo porque el admin te las pidió), no te limites a leerlas de vuelta — señalá qué destacarías y qué probarías distinto, en 2-3 ideas concretas y accionables.
- No repitas de vuelta datos sensibles que no hagan falta para la respuesta puntual (por minimización de datos) — nunca hay tokens, contraseñas ni claves de API en lo que ves, y tampoco deberías pedirlas.`;

interface PlainMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantTurnResult {
  assistantText: string;
  proposal: AiProposedAction | null;
}

/**
 * Corre un turno completo del asistente: le manda el mensaje del admin +
 * historial (ya simplificado a texto plano) a Claude, y resuelve el loop de
 * tool-calling hasta que Claude termine con texto normal o con una
 * propuesta de cambio (`propose_change`), lo que pase primero.
 *
 * IMPORTANTE: acá nunca se ejecuta ninguna mutación. Las tools de lectura
 * corren con el cliente de Supabase del admin autenticado (RLS como piso);
 * `propose_change` solo arma el objeto que después el admin confirma desde
 * la UI (ver src/app/actions/ai-assistant.ts).
 */
export async function runAssistantTurn(
  supabase: AdminClient,
  admin: Profile,
  history: PlainMessage[],
  userMessage: string
): Promise<AssistantTurnResult> {
  const anthropic = getAnthropicClient();

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content }) as Anthropic.MessageParam),
    { role: "user", content: userMessage },
  ];

  let finalText = "";
  let proposal: AiProposedAction | null = null;

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1536,
      system: `${SYSTEM_PROMPT}\n\nAdmin actual: ${admin.full_name || admin.email}.`,
      tools: [...READ_TOOLS, PROPOSE_CHANGE_TOOL],
      messages,
    });

    const textBlocks = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (textBlocks) finalText = finalText ? `${finalText}\n${textBlocks}` : textBlocks;

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) break;

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    let stopAfterThisRound = false;

    for (const block of toolUseBlocks) {
      if (block.name === "propose_change") {
        const raw = block.input as {
          action_type?: string;
          target_id?: string;
          summary?: string;
          payload?: unknown;
        };

        // Nunca confiamos ciegamente en lo que arma el modelo: el action_type
        // tiene que estar en el catálogo cerrado, y el preview (mismo código
        // que va a usar la Server Action de confirmación) tiene que poder
        // armarse sin error contra el estado real de la fila objetivo. Si
        // algo de esto falla, la propuesta ni siquiera llega a la UI — se le
        // pide a Claude que lo intente de nuevo con datos correctos.
        if (!raw.action_type || !isKnownActionType(raw.action_type) || !raw.target_id || !raw.summary) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: "Propuesta inválida: falta action_type (del catálogo conocido), target_id o summary.",
            is_error: true,
          });
          continue;
        }

        const preview = await previewAction(raw.action_type, raw.target_id, raw.payload ?? {}, supabase);
        if ("error" in preview) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `No se pudo preparar la propuesta: ${preview.error}`,
            is_error: true,
          });
          continue;
        }

        proposal = {
          action_type: raw.action_type,
          target_table: preview.targetTable,
          target_id: raw.target_id,
          summary: raw.summary,
          payload: (raw.payload as Record<string, unknown> | undefined) ?? {},
        };
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: "Propuesta registrada. Esperando confirmación humana del administrador.",
        });
        stopAfterThisRound = true;
        continue;
      }

      try {
        const result = await executeReadTool(
          block.name,
          block.input as Record<string, unknown>,
          supabase
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result).slice(0, 8000),
        });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error ejecutando la tool: ${err instanceof Error ? err.message : "desconocido"}`,
          is_error: true,
        });
      }
    }

    messages.push({ role: "user", content: toolResults });

    if (stopAfterThisRound || response.stop_reason !== "tool_use") break;
  }

  return {
    assistantText: finalText || "Listo.",
    proposal,
  };
}
