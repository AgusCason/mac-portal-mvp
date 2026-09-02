-- Conecta el switch "Alertas de Seguridad" de Mi Perfil > Notificaciones
-- (hoy: forzado ON, sin backend detrás) con la campana de notificaciones que
-- YA existe (0009_activity_notifications.sql) — decisión explícita del
-- usuario: notificación DENTRO del portal, no email (evita sumar un
-- proveedor de mail nuevo solo para esto).
--
-- notify_admins()/notify_client_members() (0009) avisan a un GRUPO; acá hace
-- falta avisarle a UNA persona puntual (quien inició sesión), así que se
-- suma notify_user() con el mismo patrón (security definer, sin policy de
-- insert para nadie más).

create or replace function public.notify_user(p_profile_id uuid, p_title text, p_body text, p_link text default null)
returns void language plpgsql security definer set search_path = public
as $$
begin
  insert into public.notifications (profile_id, title, body, link)
  values (p_profile_id, p_title, p_body, p_link);
end;
$$;

-- log_login_event() (0033) cambia de firma (suma p_ip, opcional) para poder
-- avisar "desde qué IP" — hay que borrar la versión vieja (0 argumentos)
-- porque en Postgres un cambio de firma crea una función NUEVA en vez de
-- reemplazar la anterior, y quedaría una función zombie sin usar.
drop function if exists public.log_login_event();

create or replace function public.log_login_event(p_ip text default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  perform public.log_audit('auth.login', 'auth_sessions', auth.uid()::text, 'Inicio de sesión');

  perform public.notify_user(
    auth.uid(),
    'Nuevo inicio de sesión',
    case
      when p_ip is not null and p_ip <> '' then 'Se inició sesión en tu cuenta desde la IP ' || p_ip || '.'
      else 'Se inició sesión en tu cuenta.'
    end
  );
end;
$$;

grant execute on function public.log_login_event(text) to authenticated;
