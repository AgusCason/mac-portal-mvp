import { requireRole } from "@/lib/auth";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default async function ClientDashboardPage() {
  const profile = await requireRole(["client"]);
  const clientId = await getPrimaryClientId(profile.id);
  return <RoleDashboard profile={profile} clientId={clientId ?? undefined} />;
}
