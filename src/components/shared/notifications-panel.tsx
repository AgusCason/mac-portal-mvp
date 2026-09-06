"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

import type { AppNotification } from "@/types/database";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";

function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const { locale } = useLocale();
  const unread = !notification.read_at;
  const dateLocale = locale === "en" ? enUS : es;

  function open() {
    if (unread) onRead(notification.id);
  }

  const content = (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150",
        unread ? "border-primary/30 bg-primary/5" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{notification.title}</p>
        {unread && <span className="bg-primary mt-1 size-1.5 shrink-0 rounded-full" />}
      </div>
      {notification.body && (
        <p className="text-muted-foreground mt-0.5 text-xs">{notification.body}</p>
      )}
      <p className="text-muted-foreground mt-1 text-[11px]">
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: dateLocale })}
      </p>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={open} className="block">
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={open} className="block w-full text-left">
      {content}
    </button>
  );
}

/**
 * Panel deslizante "Notificaciones" — menciones/eventos relevantes para el
 * usuario logueado (campana del navbar, equivalente al de MB Suite).
 *
 * El marcado como leído es OPTIMISTA: en vez de esperar a que la escritura
 * en la base + `revalidatePath` + `router.refresh()` vuelvan (eso puede
 * sentirse lento), el punto/badge desaparece al toque acá en el cliente y la
 * escritura real se dispara en paralelo, en segundo plano. Si más tarde llega
 * un contador del servidor MÁS ALTO que el que ya vimos (notificación nueva
 * de verdad, no la que acabamos de marcar), se descartan los overrides
 * optimistas para no esconderla.
 */
export function NotificationsPanel({
  notificationsPromise,
  unreadCountPromise,
}: {
  notificationsPromise: Promise<AppNotification[]>;
  unreadCountPromise: Promise<number>;
}) {
  // `use()` desenvuelve las promesas acá adentro, dentro del <Suspense> que
  // pone AppShell — así esta consulta no bloquea el resto del shell/página
  // mientras está en vuelo (ver app-shell.tsx). Se leen en cada render, así
  // que si el server component padre re-renderiza con promesas nuevas (por
  // ej. un router.refresh() disparado desde otro lado), acá se refleja solo.
  const serverNotifications = use(notificationsPromise);
  const serverUnreadCount = use(unreadCountPromise);
  const { t } = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [readOverrides, setReadOverrides] = React.useState<Set<string>>(() => new Set());
  const [allReadOverride, setAllReadOverride] = React.useState(false);
  const lastServerUnreadRef = React.useRef(serverUnreadCount);

  React.useEffect(() => {
    // Si el contador del servidor SUBIÓ respecto a la última vez que lo
    // vimos, llegó una notificación nueva de verdad — se descartan los
    // overrides optimistas para no seguir mostrando todo como leído.
    if (serverUnreadCount > lastServerUnreadRef.current) {
      setReadOverrides(new Set());
      setAllReadOverride(false);
    }
    lastServerUnreadRef.current = serverUnreadCount;
  }, [serverUnreadCount]);

  const notifications = React.useMemo(
    () =>
      serverNotifications.map((n) =>
        !n.read_at && (allReadOverride || readOverrides.has(n.id))
          ? { ...n, read_at: new Date().toISOString() }
          : n
      ),
    [serverNotifications, allReadOverride, readOverrides]
  );
  const unreadCount = allReadOverride ? 0 : Math.max(0, serverUnreadCount - readOverrides.size);

  function markOneRead(id: string) {
    setReadOverrides((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    startTransition(async () => {
      await markNotificationReadAction(id);
      router.refresh();
    });
  }

  function markAll() {
    setAllReadOverride(true);
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  function handleOpenChange(open: boolean) {
    // Al abrir la campana, se marca todo como leído automáticamente — no
    // hace falta que el usuario clickee nada para que el badge desaparezca.
    if (open && unreadCount > 0) markAll();
  }

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("components.shared.sectionNotifications", "Notificaciones")} className="circle-chip relative">
          <Bell />
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("components.shared.sectionNotifications", "Notificaciones")}</SheetTitle>
          <SheetDescription>{t("components.shared.notificationsPanelDesc", "Menciones, aprobaciones y avisos importantes.")}</SheetDescription>
        </SheetHeader>
        {/* <ScrollAreaPrimitive.Root> de Radix fija position:relative por
            INLINE style, así que una clase "absolute" en la propia
            ScrollArea nunca gana esa pulseada (sigue relative). El wrapper
            PLANO de acá abajo sí puede ser absolute inset-0 — con top/bottom
            en 0 su alto queda definido explícitamente, y la ScrollArea
            adentro (h-full) y su viewport interno (height:100%) resuelven en
            cascada. Ver new-client-dialog.tsx para el diagnóstico completo. */}
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0">
            <ScrollArea className="h-full px-6">
              <div className="flex flex-col gap-2 pb-6">
                {notifications.length === 0 && (
                  <p className="text-muted-foreground text-sm">{t("components.shared.noNotifications", "No tenés notificaciones.")}</p>
                )}
                {notifications.map((n) => (
                  <NotificationRow key={n.id} notification={n} onRead={markOneRead} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        {unreadCount > 0 && (
          <SheetFooter>
            <Button variant="outline" size="sm" onClick={markAll}>
              <CheckCheck /> {t("components.shared.markAllRead", "Marcar todas como leídas")}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
