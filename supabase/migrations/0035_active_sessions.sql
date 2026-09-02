-- "Sesiones activas" en Mi Perfil > Seguridad — de dónde está logueado el
-- usuario, y una forma de cerrar todo de una si sospecha que le entraron la
-- cuenta (o después de cambiar la contraseña).
--
-- `auth.sessions` (schema de Supabase Auth) no es una tabla nuestra: no
-- tiene RLS propia que podamos exponer vía PostgREST directo, así que se
-- expone SOLO lo necesario a través de una función security definer
-- filtrada por auth.uid() — mismo motivo/patrón que log_login_event().
--
-- "Cerrar sesión en todos los dispositivos" NO necesita nada acá: es
-- `supabase.auth.signOut({ scope: 'global' })` desde el cliente, ya soportado
-- nativamente por Supabase Auth (invalida todos los refresh tokens del
-- usuario del lado del servidor de Auth).
create or replace function public.list_my_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_agent text,
  ip text,
  is_current boolean
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
    select
      s.id,
      s.created_at,
      s.updated_at,
      s.user_agent,
      s.ip::text,
      s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
    from auth.sessions s
    where s.user_id = auth.uid()
    order by s.updated_at desc;
end;
$$;

grant execute on function public.list_my_sessions() to authenticated;
