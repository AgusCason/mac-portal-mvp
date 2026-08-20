import { requireRole } from "@/lib/auth";
import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default async function AdminDashboardPage() {
  const profile = await requireRole(["admin"]);
  return <RoleDashboard profile={profile} />;
}
