import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

// El middleware ya resuelve /  -> /login o /{role} antes de llegar acá.
// Este fallback cubre el caso de acceso directo sin pasar por el matcher.
export default async function RootPage() {
  const profile = await getCurrentProfile();
  redirect(profile ? `/${profile.role}` : "/login");
}
