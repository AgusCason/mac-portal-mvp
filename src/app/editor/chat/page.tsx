import { requireRole } from "@/lib/auth";
import { getEditorAssignedClients } from "@/lib/queries/editor";
import { getChatMessages } from "@/lib/queries/chat";
import { ClientSelector } from "@/components/shared/client-selector";
import { ChatThread } from "@/components/chat/chat-thread";

export default async function EditorChatPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const profile = await requireRole(["editor"]);
  const clients = (await getEditorAssignedClients(profile.id)).filter((c) => c.can_view_chat);
  const { cliente } = await searchParams;
  const activeClientId = cliente ?? clients[0]?.client_id;
  const messages = activeClientId ? await getChatMessages(activeClientId) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Chat</h1>
        <p className="text-muted-foreground text-sm">
          Solo ves clientes donde el admin activó tu acceso al chat.
        </p>
      </div>
      <ClientSelector clients={clients} />
      {activeClientId ? (
        <ChatThread clientId={activeClientId} messages={messages} currentProfileId={profile.id} />
      ) : (
        <p className="text-muted-foreground text-sm">
          No tenés acceso de chat habilitado para ningún cliente todavía.
        </p>
      )}
    </div>
  );
}
