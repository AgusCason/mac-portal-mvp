import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/shared/app-shell";
import { getRecentActivity } from "@/lib/queries/activity";
import { getNotifications, getUnreadNotificationCount } from "@/lib/queries/notifications";
import { getBranding } from "@/lib/queries/branding";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["editor"]);
  const [activity, notifications, unreadCount, branding] = await Promise.all([
    getRecentActivity(),
    getNotifications(),
    getUnreadNotificationCount(),
    getBranding(),
  ]);
  return (
    <AppShell
      profile={profile}
      activity={activity}
      notifications={notifications}
      unreadCount={unreadCount}
      branding={branding}
    >
      {children}
    </AppShell>
  );
}
