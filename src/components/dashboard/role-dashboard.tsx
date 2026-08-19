import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { EditorDashboard } from "@/components/dashboard/editor-dashboard";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import {
  getAdminDashboardData,
  getEditorDashboardData,
  getClientDashboardData,
} from "@/lib/queries/dashboard";
import type { Profile } from "@/types/database";

/**
 * ENTREGABLE 3 — Dashboard principal adaptativo según el rol.
 *
 * Server Component: recibe el `profile` ya resuelto (auth + rol) desde el
 * page.tsx de cada ruta protegida, busca los datos que le corresponden a
 * ESE rol (nunca más de lo que RLS ya le permitiría) y renderiza la vista
 * correspondiente. No hay una sola rama de código que un cliente o editor
 * pueda usar para ver datos de otro tenant: cada rama llama a su propia
 * función de datos, acotada por policies de Supabase.
 *
 * Uso:
 *   // src/app/admin/page.tsx
 *   const profile = await requireRole(["admin"]);
 *   return <RoleDashboard profile={profile} />;
 *
 * Para el rol "client", el componente necesita además el `clientId` del
 * portal que está viendo (se resuelve vía client_members en el page.tsx).
 */
export async function RoleDashboard({
  profile,
  clientId,
}: {
  profile: Profile;
  clientId?: string;
}) {
  switch (profile.role) {
    case "admin": {
      const data = await getAdminDashboardData();
      return <AdminDashboard data={data} />;
    }
    case "editor": {
      const data = await getEditorDashboardData(profile.id);
      return <EditorDashboard data={data} />;
    }
    case "client": {
      if (!clientId) {
        return (
          <p className="text-muted-foreground text-sm">
            Tu usuario todavía no está vinculado a ningún cliente. Contactá a la agencia.
          </p>
        );
      }
      const data = await getClientDashboardData(clientId);
      return <ClientDashboard data={data} />;
    }
    default:
      return null;
  }
}
