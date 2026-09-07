import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/shared/app-shell";
import { getRecentActivity } from "@/lib/queries/activity";
import { getNotifications, getUnreadNotificationCount } from "@/lib/queries/notifications";
import { getBranding } from "@/lib/queries/branding";
import { getModuleFlags } from "@/lib/queries/module-flags";
import { getPrimaryClientId, getClientStatus } from "@/lib/queries/client-membership";
import { getClientModuleOverrides } from "@/lib/queries/client-module-overrides";
import { mergeClientOverrides } from "@/lib/module-visibility";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Actividad/Notificaciones son secundarias (viven en paneles deslizables,
  // no hacen falta para pintar el sidebar) — se disparan pero NO se esperan
  // acá, así no bloquean el render del resto del layout ni de la página.
  // AppShell las resuelve adentro con `use()`, cada una en su <Suspense>.
  const activityPromise = getRecentActivity();
  const notificationsPromise = getNotifications();
  const unreadCountPromise = getUnreadNotificationCount();
  // branding/moduleFlags sí se esperan: el sidebar los necesita ya
  // resueltos para no parpadear con el nav incorrecto. requireRole() va acá
  // mismo (no antes, esperado aparte) — ninguna de las dos depende del
  // profile, así que se solapan con el chequeo de rol en vez de esperarlo.
  // getPrimaryClientId sí necesita el profile.id ya resuelto, así que ese
  // quedó afuera del Promise.all — no hay forma de adelantarlo.
  const [profile, branding, moduleFlags] = await Promise.all([
    requireRole(["client"]),
    getBranding(),
    getModuleFlags(),
  ]);
  const clientId = await getPrimaryClientId(profile.id);
  // Pausado/Perdido (ver ClientStatusMenu en la ficha admin) le corta el
  // acceso al portal — el piso real es RLS (`client_has_access()`, ver
  // 0044_block_inactive_client_access.sql), esto es solo la UX: sacarlo de
  // acá con una explicación en vez de dejarlo ver un portal vacío/roto por
  // queries que ahora vuelven sin filas. `/cuenta-pausada` está a propósito
  // FUERA de `/client/*` — si estuviera adentro, este mismo layout la
  // volvería a interceptar y quedaría en loop de redirects.
  if (clientId) {
    const status = await getClientStatus(clientId);
    if (status && status !== "active") {
      redirect(`/cuenta-pausada?status=${status}`);
    }
  }
  // Acceso por cliente puntual (ficha de cliente > pestaña Accesos) — capa
  // fina sobre moduleFlags que decide qué ve ESTE cliente en su sidebar.
  const overrides = clientId ? await getClientModuleOverrides(clientId) : {};
  const effectiveFlags = mergeClientOverrides(moduleFlags, overrides);
  return (
    <AppShell
      profile={profile}
      activity={activityPromise}
      notifications={notificationsPromise}
      unreadCount={unreadCountPromise}
      branding={branding}
      moduleFlags={effectiveFlags}
    >
      {children}
    </AppShell>
  );
}
