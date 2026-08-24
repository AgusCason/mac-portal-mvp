/**
 * Identidad de los "agentes" de IA de MAC Portal — inspirado en el patrón de
 * MB Suite (Agentes AI): ponerle nombre/rol a la IA en vez de mostrarla como
 * una feature genérica hace que el trabajo que produce se sienta hecho por
 * "alguien" del equipo, no por una caja negra. Todavía no son agentes
 * independientes con su propio roster/consumo — es la capa de identidad
 * visual sobre las dos features de IA que ya existen (Asistente + Reportes).
 */
export interface AiAgent {
  id: string;
  name: string;
  role: string;
  tagline: string;
}

/** MAX — el copiloto general, dentro del Asistente IA (chat con propose_change). */
export const MAX_AGENT: AiAgent = {
  id: "max",
  name: "MAX",
  role: "Copiloto de agencia",
  tagline: "Conoce tus clientes, contenidos y facturación — y siempre te pide confirmar antes de tocar algo.",
};

/** Nova — quien redacta el resumen ejecutivo de cada Reporte con IA. */
export const NOVA_AGENT: AiAgent = {
  id: "nova",
  name: "Nova",
  role: "Analista de Reportes",
  tagline: "Cruza piezas publicadas y métricas reales para armar el resumen ejecutivo.",
};
