import { requireRole } from "@/lib/auth";
import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default async function EditorDashboardPage() {
  const profile = await requireRole(["editor"]);
  return <RoleDashboard profile={profile} />;
}
