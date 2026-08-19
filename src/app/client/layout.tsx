import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/shared/app-shell";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["client"]);
  return <AppShell profile={profile}>{children}</AppShell>;
}
