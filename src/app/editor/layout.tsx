import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/shared/app-shell";
import { getRecentActivity } from "@/lib/queries/activity";
import { getNotifications, getUnreadNotificationCount } from "@/lib/queries/notifications";
import { getBranding } from "@/lib/queries/branding";
import { getModuleFlags } from "@/lib/queries/module-flags";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["editor"]);
  // Actividad/Notificaciones son secundarias (viven en paneles deslizables,
  // no hacen falta para pintar el sidebar) — se disparan pero NO se esperan
  // acá, así no bloquean el render del resto del layout ni de la página.
  // AppShell las resuelve adentro con `use()`, cada una en su <Suspense>.
  // branding/moduleFlags sí se esperan: el sidebar los necesita ya
  // resueltos para no parpadear con el nav incorrecto.
  const activityPromise = getRecentActivity();
  const notificationsPromise = getNotifications();
  const unreadCountPromise = getUnreadNotificationCount();
  const [branding, moduleFlags] = await Promise.all([getBranding(), getModuleFlags()]);
  return (
    <AppShell
      profile={profile}
      activity={activityPromise}
      notifications={notificationsPromise}
      unreadCount={unreadCountPromise}
      branding={branding}
      moduleFlags={moduleFlags}
    >
      {children}
    </AppShell>
  );
}
