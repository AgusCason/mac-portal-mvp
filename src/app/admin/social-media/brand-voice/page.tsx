import { requireAdmin } from "@/lib/auth";
import { getSelectableClients } from "@/lib/queries/content";
import { getClientBrandVoice } from "@/lib/queries/brand-voice";
import { BrandVoiceView } from "@/components/brand-voice/brand-voice-view";
import { PageHeader } from "@/components/shared/page-header";

/**
 * Social Media > Brand Voice — ficha de tono de marca por cuenta, con panel
 * "AI Agent" para sugerir borradores (equivalente a
 * `/demo-agency/social-media/brand-voice`).
 */
export default async function AdminBrandVoicePage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  await requireAdmin();
  const { cliente } = await searchParams;

  const clients = await getSelectableClients();
  const selectedClientId = cliente || clients[0]?.id || null;
  const brandVoice = selectedClientId ? await getClientBrandVoice(selectedClientId) : null;

  return (
    <div className="space-y-4">
      <PageHeader title="Brand Voice" description="Tono, vocabulario y audiencia de cada cuenta." />
      <BrandVoiceView clients={clients} selectedClientId={selectedClientId} brandVoice={brandVoice} />
    </div>
  );
}
