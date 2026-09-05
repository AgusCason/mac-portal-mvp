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
import { cn } from "@/lib/utils";
import { MAX_AGENT, getAgentRole, getAgentTagline } from "@/lib/ai/agents";
import { PageHeader } from "@/components/shared/page-header";
import { getT } from "@/lib/i18n/dictionary";

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
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);

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
      <PageHeader
        title={
          <>
            {t("pages.asistente.titlePrefix", "Asistente IA ·")} <span className="text-primary">{MAX_AGENT.name}</span>
          </>
        }
        description={
          <>
            {getAgentRole(MAX_AGENT, t)} — {getAgentTagline(MAX_AGENT, t)}
          </>
        }
      />

      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat">{t("nav.chat", "Chat")}</TabsTrigger>
          <TabsTrigger value="auditoria">{t("nav.config.auditoria", "Auditoría")}</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href="/admin/asistente"
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150",
                !activeConversationId
                  ? "bg-foreground text-background pointer-events-none"
                  : "bg-accent/60 text-muted-foreground hover:text-foreground"
              )}
            >
              + {t("pages.asistente.newConversation", "Nueva conversación")}
            </Link>
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/admin/asistente?conv=${c.id}`}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150",
                  c.id === activeConversationId
                    ? "bg-foreground text-background"
                    : "bg-accent/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {c.title}
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
