import { requireRole } from "@/lib/auth";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { getChatMessages } from "@/lib/queries/chat";
import { ChatThread } from "@/components/chat/chat-thread";

export default async function ClientChatPage() {
  const profile = await requireRole(["client"]);
  const clientId = await getPrimaryClientId(profile.id);
  const messages = clientId ? await getChatMessages(clientId) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Chat con la agencia</h1>
        <p className="text-muted-foreground text-sm">
          Briefs y consultas rápidas, todo en un solo lugar.
        </p>
      </div>
      {clientId ? (
        <ChatThread clientId={clientId} messages={messages} currentProfileId={profile.id} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Tu cuenta todavía no está vinculada a ningún cliente.
        </p>
      )}
    </div>
  );
}
