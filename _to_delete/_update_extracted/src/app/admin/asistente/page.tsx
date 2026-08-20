import { requireRole } from "@/lib/auth";
import {
  getAiConversation,
  getAiMessages,
  listAiAuditLog,
  listAiConversations,
} from "@/lib/queries/ai-assistant";
import { AiChatPanel } from "@/components/ai-assistant/ai-chat-panel";
import { AuditLogTable } from "@/components/ai-assistant/audit-log-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Asistente IA — SOLO Admin (ver proxy.ts + requireRole acá abajo, más las
 * policies RLS de ai_conversations/ai_messages/ai_audit_log). Lee y propone
 * cambios usando siempre el cliente Supabase del propio admin logueado
 * (RLS como piso de seguridad), nunca la Service Role Key.
 */
export default async function AiAssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>;
}) {
  await requireRole(["admin"]);

  const { conv } = await searchParams;
  const conversations = await listAiConversations();
  const activeConversation = conv
    ? await getAiConversation(conv)
    : (conversations[0] ?? null);
  const activeConversationId = activeConversation?.id ?? null;

  const [messages, auditLog] = await Promise.all([
    activeConversationId ? getAiMessages(activeConversationId) : Promise.resolve([]),
    listAiAuditLog(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Asistente IA</h1>
        <p className="text-muted-foreground text-sm">
          Lee datos de la agencia con tu propio acceso y puede proponer arreglos —
          nunca aplica nada sin que lo confirmes vos.
        </p>
      </div>

      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/asistente"
              className={cn(
                "text-xs",
                !activeConversationId ? "pointer-events-none" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Badge variant={activeConversationId ? "outline" : "secondary"}>
                + Nueva conversación
              </Badge>
            </Link>
            {conversations.map((c) => (
              <Link key={c.id} href={`/admin/asistente?conv=${c.id}`}>
                <Badge variant={c.id === activeConversationId ? "default" : "outline"}>
                  {c.title}
                </Badge>
              </Link>
            ))}
          </div>
          <AiChatPanel conversationId={activeConversationId} messages={messages} />
        </TabsContent>

        <TabsContent value="auditoria">
          <AuditLogTable entries={auditLog} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
