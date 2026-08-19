-- ============================================================================
-- MAC Portal — Schema inicial + Row Level Security
-- Pegar y ejecutar en Supabase SQL Editor (Proyecto > SQL Editor > New query)
-- Orden: este archivo primero, luego (opcional) 0002_seed.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. TIPOS ENUM
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'editor', 'client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type client_status as enum ('active', 'paused', 'churned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type drive_folder_type as enum ('crudos', 'en_edicion', 'entregables_finales');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_network as enum (
    'instagram_reel', 'instagram_feed', 'instagram_story',
    'tiktok', 'youtube_short', 'youtube_long'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum (
    'borrador', 'en_edicion', 'por_aprobar', 'requiere_cambios',
    'aprobado', 'programado', 'publicado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type contract_status as enum ('pendiente', 'firmado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_direction as enum ('inbound', 'outbound');
exception when duplicate_object then null; end $$;

do $$ begin
  create type social_platform as enum ('instagram', 'tiktok', 'youtube');
exception when duplicate_object then null; end $$;

do $$ begin
  create type plan_status as enum ('active', 'paused', 'ended');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. TABLAS
-- ---------------------------------------------------------------------------

-- Perfil de cada usuario autenticado (1:1 con auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role user_role not null default 'client',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Clientes (marcas / creadores) de la agencia
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_name text,
  logo_url text,
  contact_email text,
  contact_phone text,
  status client_status not null default 'active',
  drive_root_folder_id text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Usuarios del lado "cliente" que pueden loguearse a ver el portal de esa marca
create table if not exists public.client_members (
  client_id uuid not null references public.clients (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, profile_id)
);

-- Planes comerciales (información financiera — NUNCA visible para editores)
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_monthly numeric(12, 2) not null default 0,
  currency text not null default 'ARS',
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Plan asignado a un cliente (con posible override de precio)
create table if not exists public.client_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  price_override numeric(12, 2),
  status plan_status not null default 'active',
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz not null default now()
);

-- Asignación granular de editores a clientes (con permisos de chat / drive)
create table if not exists public.editor_client_assignments (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  can_view_chat boolean not null default false,
  can_view_drive boolean not null default true,
  assigned_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (editor_id, client_id)
);

-- Carpetas de Google Drive generadas automáticamente por cliente
create table if not exists public.drive_folders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  folder_type drive_folder_type not null,
  drive_folder_id text not null,
  created_at timestamptz not null default now(),
  unique (client_id, folder_type)
);

-- Calendario editorial / piezas de contenido
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  description text,
  network content_network not null,
  status content_status not null default 'borrador',
  scheduled_at timestamptz,
  drive_file_id text,
  thumbnail_url text,
  assigned_editor_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Comentarios / feedback sobre una pieza de contenido (con marca de tiempo opcional)
create table if not exists public.content_comments (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null,
  timestamp_seconds numeric,
  created_at timestamptz not null default now()
);

-- Contratos y documentos legales
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  file_url text not null,
  status contract_status not null default 'pendiente',
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Mensajes de WhatsApp / chat centralizado por cliente
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  sender_profile_id uuid references public.profiles (id),
  direction message_direction not null,
  body text not null,
  whatsapp_message_id text,
  created_at timestamptz not null default now()
);

-- Cuentas de redes sociales conectadas (Meta Graph API / TikTok / YouTube)
create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  platform social_platform not null,
  external_account_id text not null,
  display_name text,
  access_token_encrypted text,
  connected_by uuid references public.profiles (id),
  connected_at timestamptz not null default now()
);

-- Métricas diarias por cuenta social
create table if not exists public.social_metrics (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid not null references public.social_accounts (id) on delete cascade,
  metric_date date not null,
  reach integer default 0,
  impressions integer default 0,
  engagement_rate numeric(6, 3) default 0,
  followers integer default 0,
  plays integer default 0,
  unique (social_account_id, metric_date)
);

-- ---------------------------------------------------------------------------
-- 3. TRIGGER: crear profile automáticamente al registrarse en auth.users
--    El rol viene de raw_user_meta_data->>'role' (seteado por el flujo de
--    invitación del admin). Default 'client' si no se especifica.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.clients;
create trigger set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.content_items;
create trigger set_updated_at before update on public.content_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. FUNCIONES HELPER (security definer, usadas dentro de las políticas RLS)
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.editor_has_client(target_client_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.editor_client_assignments
    where editor_id = auth.uid() and client_id = target_client_id
  );
$$;

create or replace function public.editor_can_view_chat(target_client_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.editor_client_assignments
    where editor_id = auth.uid() and client_id = target_client_id and can_view_chat = true
  );
$$;

create or replace function public.editor_can_view_drive(target_client_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.editor_client_assignments
    where editor_id = auth.uid() and client_id = target_client_id and can_view_drive = true
  );
$$;

create or replace function public.client_has_access(target_client_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.client_members
    where profile_id = auth.uid() and client_id = target_client_id
  );
$$;

-- RPC segura para que el cliente apruebe/pida cambios sin poder tocar el resto
-- de la fila (evita darle UPDATE directo sobre content_items).
create or replace function public.set_content_approval(
  target_content_id uuid,
  new_status content_status,
  feedback text default null
)
returns public.content_items
language plpgsql security definer set search_path = public
as $$
declare
  updated_row public.content_items;
  target_client uuid;
begin
  select client_id into target_client from public.content_items where id = target_content_id;

  if new_status not in ('aprobado', 'requiere_cambios') then
    raise exception 'Estado no permitido para esta acción';
  end if;

  if not public.client_has_access(target_client) then
    raise exception 'No autorizado';
  end if;

  update public.content_items
    set status = new_status
    where id = target_content_id
    returning * into updated_row;

  if feedback is not null and length(trim(feedback)) > 0 then
    insert into public.content_comments (content_item_id, author_id, body)
    values (target_content_id, auth.uid(), feedback);
  end if;

  return updated_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_members enable row level security;
alter table public.plans enable row level security;
alter table public.client_plans enable row level security;
alter table public.editor_client_assignments enable row level security;
alter table public.drive_folders enable row level security;
alter table public.content_items enable row level security;
alter table public.content_comments enable row level security;
alter table public.contracts enable row level security;
alter table public.chat_messages enable row level security;
alter table public.social_accounts enable row level security;
alter table public.social_metrics enable row level security;

-- profiles: cada usuario ve/edita su propio perfil; admin ve todos
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert" on public.profiles
  for insert with check (public.is_admin() or id = auth.uid());

-- clients: admin todo; editor asignado (select); miembros del cliente (select)
drop policy if exists "clients_admin_all" on public.clients;
create policy "clients_admin_all" on public.clients
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clients_editor_select" on public.clients;
create policy "clients_editor_select" on public.clients
  for select using (public.editor_has_client(id));

drop policy if exists "clients_member_select" on public.clients;
create policy "clients_member_select" on public.clients
  for select using (public.client_has_access(id));

-- client_members: admin todo; el propio usuario puede ver sus vínculos
drop policy if exists "client_members_admin_all" on public.client_members;
create policy "client_members_admin_all" on public.client_members
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "client_members_self_select" on public.client_members;
create policy "client_members_self_select" on public.client_members
  for select using (profile_id = auth.uid());

-- plans / client_plans: SOLO admin. Editores y clientes no tienen policy -> sin acceso.
drop policy if exists "plans_admin_all" on public.plans;
create policy "plans_admin_all" on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "client_plans_admin_all" on public.client_plans;
create policy "client_plans_admin_all" on public.client_plans
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "client_plans_member_select" on public.client_plans;
create policy "client_plans_member_select" on public.client_plans
  for select using (public.client_has_access(client_id));

-- editor_client_assignments: admin todo; el editor ve sus propias asignaciones
drop policy if exists "assignments_admin_all" on public.editor_client_assignments;
create policy "assignments_admin_all" on public.editor_client_assignments
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "assignments_editor_select" on public.editor_client_assignments;
create policy "assignments_editor_select" on public.editor_client_assignments
  for select using (editor_id = auth.uid());

-- drive_folders: admin todo; editor con can_view_drive; miembros del cliente
drop policy if exists "drive_folders_admin_all" on public.drive_folders;
create policy "drive_folders_admin_all" on public.drive_folders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "drive_folders_editor_select" on public.drive_folders;
create policy "drive_folders_editor_select" on public.drive_folders
  for select using (public.editor_can_view_drive(client_id));

drop policy if exists "drive_folders_member_select" on public.drive_folders;
create policy "drive_folders_member_select" on public.drive_folders
  for select using (public.client_has_access(client_id));

-- content_items: admin todo; editor asignado (CRUD); cliente solo select
-- (las transiciones aprobado/requiere_cambios del cliente pasan por la RPC
--  set_content_approval, que corre con security definer)
drop policy if exists "content_admin_all" on public.content_items;
create policy "content_admin_all" on public.content_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content_editor_all" on public.content_items;
create policy "content_editor_all" on public.content_items
  for all using (public.editor_has_client(client_id))
  with check (public.editor_has_client(client_id));

drop policy if exists "content_member_select" on public.content_items;
create policy "content_member_select" on public.content_items
  for select using (public.client_has_access(client_id));

-- content_comments: admin todo; editor/cliente con acceso al cliente dueño del contenido
drop policy if exists "comments_admin_all" on public.content_comments;
create policy "comments_admin_all" on public.content_comments
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "comments_editor_rw" on public.content_comments;
create policy "comments_editor_rw" on public.content_comments
  for all using (
    exists (
      select 1 from public.content_items ci
      where ci.id = content_item_id and public.editor_has_client(ci.client_id)
    )
  )
  with check (
    exists (
      select 1 from public.content_items ci
      where ci.id = content_item_id and public.editor_has_client(ci.client_id)
    )
  );

drop policy if exists "comments_member_rw" on public.content_comments;
create policy "comments_member_rw" on public.content_comments
  for all using (
    exists (
      select 1 from public.content_items ci
      where ci.id = content_item_id and public.client_has_access(ci.client_id)
    )
  )
  with check (
    exists (
      select 1 from public.content_items ci
      where ci.id = content_item_id and public.client_has_access(ci.client_id)
    )
  );

-- contracts: SOLO admin y el cliente dueño (editores no tienen acceso legal/financiero)
drop policy if exists "contracts_admin_all" on public.contracts;
create policy "contracts_admin_all" on public.contracts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "contracts_member_select" on public.contracts;
create policy "contracts_member_select" on public.contracts
  for select using (public.client_has_access(client_id));

-- chat_messages: admin todo; editor SOLO si can_view_chat=true; miembros del cliente
drop policy if exists "chat_admin_all" on public.chat_messages;
create policy "chat_admin_all" on public.chat_messages
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "chat_editor_rw" on public.chat_messages;
create policy "chat_editor_rw" on public.chat_messages
  for all using (public.editor_can_view_chat(client_id))
  with check (public.editor_can_view_chat(client_id));

drop policy if exists "chat_member_rw" on public.chat_messages;
create policy "chat_member_rw" on public.chat_messages
  for all using (public.client_has_access(client_id))
  with check (public.client_has_access(client_id));

-- social_accounts / social_metrics: admin todo; editor y cliente solo lectura
drop policy if exists "social_accounts_admin_all" on public.social_accounts;
create policy "social_accounts_admin_all" on public.social_accounts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "social_accounts_editor_select" on public.social_accounts;
create policy "social_accounts_editor_select" on public.social_accounts
  for select using (public.editor_has_client(client_id));

drop policy if exists "social_accounts_member_select" on public.social_accounts;
create policy "social_accounts_member_select" on public.social_accounts
  for select using (public.client_has_access(client_id));

drop policy if exists "social_metrics_admin_all" on public.social_metrics;
create policy "social_metrics_admin_all" on public.social_metrics
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "social_metrics_editor_select" on public.social_metrics;
create policy "social_metrics_editor_select" on public.social_metrics
  for select using (
    exists (
      select 1 from public.social_accounts sa
      where sa.id = social_account_id and public.editor_has_client(sa.client_id)
    )
  );

drop policy if exists "social_metrics_member_select" on public.social_metrics;
create policy "social_metrics_member_select" on public.social_metrics
  for select using (
    exists (
      select 1 from public.social_accounts sa
      where sa.id = social_account_id and public.client_has_access(sa.client_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 6. ÍNDICES
-- ---------------------------------------------------------------------------
create index if not exists idx_content_items_client on public.content_items (client_id);
create index if not exists idx_content_items_status on public.content_items (status);
create index if not exists idx_chat_messages_client on public.chat_messages (client_id, created_at desc);
create index if not exists idx_assignments_editor on public.editor_client_assignments (editor_id);
create index if not exists idx_assignments_client on public.editor_client_assignments (client_id);
create index if not exists idx_social_metrics_date on public.social_metrics (social_account_id, metric_date desc);
