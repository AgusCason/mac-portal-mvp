-- ============================================================================
-- MAC Portal — Sitios Web: seguimiento de proyectos de diseño y desarrollo
-- web por cliente. Es un servicio aparte de "Proyectos" (genérico): tiene
-- sus propias etapas (Brief → Diseño → Desarrollo → QA → Lanzamiento →
-- Mantenimiento, más Pausado/Cancelado), campos técnicos (dominio, staging,
-- producción, hosting, stack) y una vista de avance para el cliente final,
-- que además puede aprobar o pedir cambios sobre cada entregable (mockup,
-- link de staging, etc.) — mismo patrón que `set_content_approval` /
-- `sign_contract`: el cliente nunca tiene UPDATE directo sobre la fila,
-- todo pasa por una RPC security definer.
-- ============================================================================

do $$ begin
  create type web_project_stage as enum (
    'brief', 'diseno', 'desarrollo', 'qa', 'lanzamiento', 'mantenimiento',
    'pausado', 'cancelado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type web_asset_status as enum ('pendiente', 'aprobado', 'requiere_cambios');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 1. web_projects
-- ---------------------------------------------------------------------------
create table if not exists public.web_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  description text not null default '',
  stage web_project_stage not null default 'brief',
  domain text,
  staging_url text,
  production_url text,
  hosting_provider text,
  tech_stack text,
  launch_date date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_web_projects_client on public.web_projects (client_id);

alter table public.web_projects enable row level security;

drop policy if exists "web_projects_admin_all" on public.web_projects;
create policy "web_projects_admin_all" on public.web_projects
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "web_projects_member_select" on public.web_projects;
create policy "web_projects_member_select" on public.web_projects
  for select using (public.client_has_access(client_id));

-- ---------------------------------------------------------------------------
-- 2. web_project_assets (mockups, links de staging, entregables en general)
-- ---------------------------------------------------------------------------
create table if not exists public.web_project_assets (
  id uuid primary key default gen_random_uuid(),
  web_project_id uuid not null references public.web_projects (id) on delete cascade,
  title text not null,
  file_url text not null,
  status web_asset_status not null default 'pendiente',
  client_note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_web_project_assets_project on public.web_project_assets (web_project_id);

alter table public.web_project_assets enable row level security;

drop policy if exists "web_project_assets_admin_all" on public.web_project_assets;
create policy "web_project_assets_admin_all" on public.web_project_assets
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "web_project_assets_member_select" on public.web_project_assets;
create policy "web_project_assets_member_select" on public.web_project_assets
  for select using (
    exists (
      select 1 from public.web_projects wp
      where wp.id = web_project_id and public.client_has_access(wp.client_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 3. RPC: el cliente aprueba o pide cambios sobre un entregable propio, sin
--    poder tocar título/archivo ni ningún otro campo de la fila.
-- ---------------------------------------------------------------------------
create or replace function public.set_web_asset_approval(
  target_asset_id uuid,
  new_status web_asset_status,
  note text default null
)
returns public.web_project_assets
language plpgsql security definer set search_path = public
as $$
declare
  updated_row public.web_project_assets;
  target_client uuid;
begin
  select wp.client_id into target_client
    from public.web_project_assets wa
    join public.web_projects wp on wp.id = wa.web_project_id
    where wa.id = target_asset_id;

  if target_client is null then
    raise exception 'Entregable no encontrado';
  end if;

  if new_status not in ('aprobado', 'requiere_cambios') then
    raise exception 'Estado no permitido para esta acción';
  end if;

  if not public.client_has_access(target_client) then
    raise exception 'No autorizado';
  end if;

  update public.web_project_assets
    set status = new_status, client_note = note, updated_at = now()
    where id = target_asset_id
    returning * into updated_row;

  return updated_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Semilla de module_flags — mismo patrón que 0022_module_flags_backfill.sql
--    (opt-out: sin esta fila el módulo igual queda visible, pero así el
--    admin ya lo puede apagar/restringir desde Configuración > Módulos).
-- ---------------------------------------------------------------------------
insert into public.module_flags (key)
values ('sitios-web')
on conflict (key) do nothing;
