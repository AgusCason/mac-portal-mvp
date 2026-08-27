-- Hardening de seguridad: rate limiting + bloqueo automático temporal +
-- índice de auditoría por tipo de acción.
--
-- Arquitectura: todo vive en Postgres (sin Redis/Upstash ni otro servicio
-- externo) a propósito — las Netlify Functions/Server Actions son stateless
-- entre invocaciones, así que el contador necesita vivir en un lugar
-- compartido, y Supabase ya es ese lugar. Cero infraestructura nueva.
--
-- `check_rate_limit()` es una función atómica de "ventana fija" (fixed
-- window). Cada `p_key` (ej. "webhook:whatsapp:5491122334455" o
-- "login:admin@mac.com:190.1.2.3") tiene su propio contador. Si se pasa de
-- `p_max_hits` dentro de `p_window_seconds`, se crea un bloqueo temporal de
-- `p_block_minutes` en `security_blocks` — la auto-remediación "alertar +
-- bloqueo temporal" que pidió el admin — y queda registrado en audit_log. El
-- bloqueo se destraba solo cuando pasa `blocked_until`, sin necesitar
-- intervención manual; el admin puede levantarlo antes a mano borrando la
-- fila si hace falta.

create table if not exists public.rate_limit_buckets (
  key text primary key,
  window_start timestamptz not null default now(),
  hit_count integer not null default 0
);

create table if not exists public.security_blocks (
  id uuid primary key default gen_random_uuid(),
  block_key text not null,
  reason text not null,
  blocked_until timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_blocks_key on public.security_blocks (block_key, blocked_until desc);
create index if not exists idx_security_blocks_created on public.security_blocks (created_at desc);

alter table public.rate_limit_buckets enable row level security;
alter table public.security_blocks enable row level security;

-- Ninguna policy de insert/update para authenticated/anon en ninguna de las
-- dos tablas: todo el acceso de escritura pasa por check_rate_limit()
-- (SECURITY DEFINER) — mismo patrón que activity_events/audit_log. El admin
-- sí puede auditar bloqueos activos/recientes desde una vista de solo lectura.
drop policy if exists "security_blocks_admin_select" on public.security_blocks;
create policy "security_blocks_admin_select" on public.security_blocks
  for select using (public.is_admin());

create or replace function public.is_blocked(p_key text)
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.security_blocks
    where block_key = p_key and blocked_until > now()
  );
$$;

create or replace function public.check_rate_limit(
  p_key text,
  p_max_hits integer,
  p_window_seconds integer,
  p_block_minutes integer default 30
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_bucket record;
begin
  if public.is_blocked(p_key) then
    return false;
  end if;

  insert into public.rate_limit_buckets (key, window_start, hit_count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    hit_count = case
      when public.rate_limit_buckets.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
      else public.rate_limit_buckets.hit_count + 1
    end,
    window_start = case
      when public.rate_limit_buckets.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
      else public.rate_limit_buckets.window_start
    end
  returning * into v_bucket;

  if v_bucket.hit_count > p_max_hits then
    insert into public.security_blocks (block_key, reason, blocked_until)
    values (p_key, 'rate_limit_exceeded', now() + make_interval(mins => p_block_minutes));

    perform public.log_audit(
      'security.blocked', 'security_blocks', p_key,
      'Bloqueo automático temporal (' || p_block_minutes || ' min) por exceso de intentos: ' || p_key
    );

    return false;
  end if;

  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, integer, integer, integer) to anon, authenticated;
grant execute on function public.is_blocked(text) to anon, authenticated;

-- Índice para el filtro por tipo de acción en Configuración > Auditoría.
create index if not exists idx_audit_log_action_type on public.audit_log (action_type);
