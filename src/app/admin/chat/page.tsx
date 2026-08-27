import { requireRole } from "@/lib/auth";
import { getSelectableClients } from "@/lib/queries/content";
import { getChatMessages } from "@/lib/queries/chat";
import { ClientSelector } from "@/components/shared/client-selector";
import { ChatThread } from "@/components/chat/chat-thread";
import { getT } from "@/lib/i18n/dictionary";

export default async function AdminChatPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const clients = await getSelectableClients();
  const { cliente } = await searchParams;
  const activeClientId = cliente ?? clients[0]?.id;
  const messages = activeClientId ? await getChatMessages(activeClientId) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("nav.chat", "Chat")}</h1>
        <p className="text-muted-foreground text-sm">
          Bandeja centralizada por cliente (WhatsApp Cloud API).
        </p>
      </div>
      <ClientSelector clients={clients.map((c) => ({ client_id: c.id, name: c.name }))} />
      {activeClientId && (
        <ChatThread clientId={activeClientId} messages={messages} currentProfileId={profile.id} />
      )}
    </div>
  );
}
