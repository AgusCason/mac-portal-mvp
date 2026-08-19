import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/shared/app-shell";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["editor"]);
  return <AppShell profile={profile}>{children}</AppShell>;
}
