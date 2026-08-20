-- 0006_profile_role_guard.sql
-- Fix de seguridad: la policy "profiles_update_own" (0001_schema.sql) permite
-- que cada usuario actualice su propia fila en `profiles` (necesario para que
-- Cliente/Editor/Admin puedan subir su propio avatar o cambiar su nombre),
-- pero tal cual estaba escrita no restringía QUÉ columnas podían tocar: un
-- usuario autenticado podía, en teoría, hacer
--   update profiles set role = 'admin' where id = auth.uid()
-- y auto-promoverse, porque la policy solo valida `id = auth.uid()` sin
-- comparar el valor anterior de `role`.
--
-- Un trigger BEFORE UPDATE (en vez de un `with check` con subquery sobre la
-- misma tabla, que es ambiguo en Postgres respecto a qué snapshot ve) es la
-- forma confiable de comparar OLD vs NEW y bloquear el cambio si quien lo
-- pide no es admin.

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'No podés cambiar tu propio rol.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role
  before update on public.profiles
  for each row
  execute function public.prevent_self_role_escalation();
