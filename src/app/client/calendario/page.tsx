import { requireRole } from "@/lib/auth";
import { getContentItems } from "@/lib/queries/content";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { ContentBoard } from "@/components/content/content-board";

export default async function ClientCalendarioPage() {
  const profile = await requireRole(["client"]);
  const clientId = await getPrimaryClientId(profile.id);
  const items = clientId ? await getContentItems(clientId) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tu calendario editorial</h1>
        <p className="text-muted-foreground text-sm">
          Previsualizá, aprobá con un clic o pedí cambios con feedback puntual.
        </p>
      </div>
      <ContentBoard items={items} role="client" />
    </div>
  );
}
