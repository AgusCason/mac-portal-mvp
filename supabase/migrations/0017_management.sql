-- ============================================================================
-- MAC Portal — Fase "Management" de la adaptación "estilo MB Suite": agrega
-- las 6 sub-secciones nuevas de Management (las otras 2 — Bóveda y
-- Actividad — ya existían de fases anteriores y solo se reutilizan):
-- Tareas, Proyectos, Contactos, Media Library, Knowledge Base, Web Forms.
--
-- Todo Management es una herramienta interna de la agencia — ningún cliente
-- final tiene acceso a estas tablas, por eso las policies son simplemente
-- "solo admin" (is_admin()), salvo las 2 excepciones explícitas de Web Forms
-- que necesitan ser públicas (el visitante que completa el formulario no
-- tiene sesión).
-- ============================================================================

do $$ begin
  create type task_status as enum ('pendiente', 'en_curso', 'completada', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('baja', 'media', 'alta', 'urgente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum ('por_iniciar', 'en_curso', 'en_pausa', 'completado', 'cancelado');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 1. Tareas
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  status task_status not null default 'pendiente',
  priority task_priority not null default 'media',
  due_date date,
  client_id uuid references public.clients (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_due_date on public.tasks (due_date);

alter table public.tasks enable row level security;

drop policy if exists "tasks_admin_all" on public.tasks;
create policy "tasks_admin_all" on public.tasks
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Proyectos (+ items — el tablero kanban de cada proyecto)
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  client_id uuid references public.clients (id) on delete set null,
  status project_status not null default 'por_iniciar',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "projects_admin_all" on public.projects;
create policy "projects_admin_all" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.project_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  status project_status not null default 'por_iniciar',
  assigned_to uuid references public.profiles (id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_items_project on public.project_items (project_id);

alter table public.project_items enable row level security;

drop policy if exists "project_items_admin_all" on public.project_items;
create policy "project_items_admin_all" on public.project_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Contactos
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text,
  email text,
  phone text,
  tags text[] not null default '{}',
  client_id uuid references public.clients (id) on delete set null,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_client on public.contacts (client_id);

alter table public.contacts enable row level security;

drop policy if exists "contacts_admin_all" on public.contacts;
create policy "contacts_admin_all" on public.contacts
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Media Library (carpetas + archivos, bucket privado propio)
-- ---------------------------------------------------------------------------
create table if not exists public.media_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default 'gray',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.media_folders enable row level security;

drop policy if exists "media_folders_admin_all" on public.media_folders;
create policy "media_folders_admin_all" on public.media_folders
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.media_folders (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_media_assets_folder on public.media_assets (folder_id);

alter table public.media_assets enable row level security;

drop policy if exists "media_assets_admin_all" on public.media_assets;
create policy "media_assets_admin_all" on public.media_assets
  for all using (public.is_admin()) with check (public.is_admin());

-- Bucket privado — igual que "reports": nadie lee directo del bucket, todo
-- acceso pasa por una Server Action que valida is_admin() y recién ahí
-- genera una signed URL de corta duración con la Service Role Key.
insert into storage.buckets (id, name, public)
values ('media-library', 'media-library', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Knowledge Base
-- ---------------------------------------------------------------------------
create table if not exists public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  is_pinned boolean not null default false,
  views_count integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kb_articles enable row level security;

drop policy if exists "kb_articles_admin_all" on public.kb_articles;
create policy "kb_articles_admin_all" on public.kb_articles
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.kb_article_favorites (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  article_id uuid not null references public.kb_articles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, article_id)
);

alter table public.kb_article_favorites enable row level security;

drop policy if exists "kb_article_favorites_owner_select" on public.kb_article_favorites;
create policy "kb_article_favorites_owner_select" on public.kb_article_favorites
  for select using (profile_id = auth.uid());

drop policy if exists "kb_article_favorites_owner_insert" on public.kb_article_favorites;
create policy "kb_article_favorites_owner_insert" on public.kb_article_favorites
  for insert with check (profile_id = auth.uid() and public.is_admin());

drop policy if exists "kb_article_favorites_owner_delete" on public.kb_article_favorites;
create policy "kb_article_favorites_owner_delete" on public.kb_article_favorites
  for delete using (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. Web Forms — la única parte de Management con visitas sin sesión: el
-- lead completa el formulario público en /f/[id], por eso necesita 2
-- policies puntuales para el rol anon (ver comentario de cabecera).
-- ---------------------------------------------------------------------------
create table if not exists public.web_forms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.web_forms enable row level security;

drop policy if exists "web_forms_admin_all" on public.web_forms;
create policy "web_forms_admin_all" on public.web_forms
  for all using (public.is_admin()) with check (public.is_admin());

-- El visitante público solo puede leer el nombre/descripción de un form
-- ACTIVO (para poder renderizar /f/[id]) — nunca la lista completa ni los
-- inactivos.
drop policy if exists "web_forms_public_select_active" on public.web_forms;
create policy "web_forms_public_select_active" on public.web_forms
  for select using (is_active = true);

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.web_forms (id) on delete cascade,
  name text not null,
  email text not null,
  message text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_form_submissions_form on public.form_submissions (form_id, created_at desc);

alter table public.form_submissions enable row level security;

drop policy if exists "form_submissions_admin_select" on public.form_submissions;
create policy "form_submissions_admin_select" on public.form_submissions
  for select using (public.is_admin());

-- El visitante público puede INSERTAR una respuesta, pero solo si el form al
-- que apunta existe y sigue activo — así un form desactivado deja de recibir
-- respuestas nuevas sin tener que borrar nada.
drop policy if exists "form_submissions_public_insert" on public.form_submissions;
create policy "form_submissions_public_insert" on public.form_submissions
  for insert with check (
    exists (select 1 from public.web_forms w where w.id = form_id and w.is_active)
  );
