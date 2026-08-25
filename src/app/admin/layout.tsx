import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/shared/app-shell";
import { getRecentActivity } from "@/lib/queries/activity";
import { getNotifications, getUnreadNotificationCount } from "@/lib/queries/notifications";
import { getBranding } from "@/lib/queries/branding";
import { getModuleFlags } from "@/lib/queries/module-flags";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["admin"]);
  const [activity, notifications, unreadCount, branding, moduleFlags] = await Promise.all([
    getRecentActivity(),
    getNotifications(),
    getUnreadNotificationCount(),
    getBranding(),
    getModuleFlags(),
  ]);
  return (
    <AppShell
      profile={profile}
      activity={activity}
      notifications={notifications}
      unreadCount={unreadCount}
      branding={branding}
      moduleFlags={moduleFlags}
    >
      {children}
    </AppShell>
  );
}
