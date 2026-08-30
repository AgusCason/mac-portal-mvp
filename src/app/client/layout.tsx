import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/shared/app-shell";
import { getRecentActivity } from "@/lib/queries/activity";
import { getNotifications, getUnreadNotificationCount } from "@/lib/queries/notifications";
import { getBranding } from "@/lib/queries/branding";
import { getModuleFlags } from "@/lib/queries/module-flags";
import { getPrimaryClientId } from "@/lib/queries/client-membership";
import { getClientModuleOverrides } from "@/lib/queries/client-module-overrides";
import { mergeClientOverrides } from "@/lib/module-visibility";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["client"]);
  const [activity, notifications, unreadCount, branding, moduleFlags, clientId] = await Promise.all([
    getRecentActivity(),
    getNotifications(),
    getUnreadNotificationCount(),
    getBranding(),
    getModuleFlags(),
    getPrimaryClientId(profile.id),
  ]);
  // Acceso por cliente puntual (ficha de cliente > pestaña Accesos) — capa
  // fina sobre moduleFlags que decide qué ve ESTE cliente en su sidebar.
  const overrides = clientId ? await getClientModuleOverrides(clientId) : {};
  const effectiveFlags = mergeClientOverrides(moduleFlags, overrides);
  return (
    <AppShell
      profile={profile}
      activity={activity}
      notifications={notifications}
      unreadCount={unreadCount}
      branding={branding}
      moduleFlags={effectiveFlags}
    >
      {children}
    </AppShell>
  );
}
