import { requireRole } from "@/lib/auth";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { getChatMessages } from "@/lib/queries/chat";
import { ChatThread } from "@/components/chat/chat-thread";
import { getT } from "@/lib/i18n/dictionary";

export default async function ClientChatPage({
  searchParams,
}: {
  searchParams: Promise<{ prefill?: string }>;
}) {
  const profile = await requireRole(["client"]);
  const t = getT(profile.language);
  const clientId = await getPrimaryClientId(profile.id);
  const messages = clientId ? await getChatMessages(clientId) : [];
  const { prefill } = await searchParams;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("pages.clientChat.title", "Chat con la agencia")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("pages.clientChat.description", "Briefs y consultas rápidas, todo en un solo lugar.")}
        </p>
      </div>
      {clientId ? (
        <ChatThread
          key={prefill ?? "default"}
          clientId={clientId}
          messages={messages}
          currentProfileId={profile.id}
          defaultMessage={prefill}
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          {t("pages.client.noClientLinked", "Tu cuenta todavía no está vinculada a ningún cliente.")}
        </p>
      )}
    </div>
  );
}
