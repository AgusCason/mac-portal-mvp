-- ============================================================================
-- MAC Portal — Fase "Social Media" de la adaptación "estilo MB Suite".
-- MB Suite tiene 6 sub-secciones en Social Media: Overview, Insights,
-- Planner, Content Studio, Brand Voice, Competidores.
--
-- De esas, Overview y Planner se arman 100% con datos que YA existen
-- (content_items, social_accounts) — no necesitan tablas nuevas. Insights
-- reutiliza el dashboard de métricas que ya existe en /admin/redes. Lo que
-- sí es nuevo acá es: Content Studio (banco de ideas/guiones), Brand Voice
-- (ficha de tono de marca por cuenta) y Competidores (benchmark).
--
-- Todo esto es herramienta interna de la agencia — igual que Management,
-- RLS es simplemente "solo admin".
-- ============================================================================

do $$ begin
  create type content_idea_type as enum (
    'serie_social', 'sesion_fotos', 'video_script', 'caption', 'content_bank'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 1. Content Studio — banco de ideas y guiones de contenido
-- ---------------------------------------------------------------------------
create table if not exists public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  type content_idea_type not null,
  client_id uuid references public.clients (id) on delete set null,
  title text not null,
  body text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_content_ideas_type on public.content_ideas (type);

alter table public.content_ideas enable row level security;

drop policy if exists "content_ideas_admin_all" on public.content_ideas;
create policy "content_ideas_admin_all" on public.content_ideas
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Brand Voice — ficha de tono de marca, una por cuenta
-- ---------------------------------------------------------------------------
create table if not exists public.client_brand_voice (
  client_id uuid primary key references public.clients (id) on delete cascade,
  tone_personality text not null default '',
  vocabulary text not null default '',
  emoji_rules text not null default '',
  target_audience text not null default '',
  platform_settings text not null default '',
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.client_brand_voice enable row level security;

drop policy if exists "client_brand_voice_admin_all" on public.client_brand_voice;
create policy "client_brand_voice_admin_all" on public.client_brand_voice
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Competidores — benchmark de perfiles de la competencia por cuenta
-- ---------------------------------------------------------------------------
create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete cascade,
  name text not null,
  platform social_platform not null,
  handle text not null default '',
  followers_count bigint,
  engagement_rate numeric(5, 2),
  notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_competitors_client on public.competitors (client_id);

alter table public.competitors enable row level security;

drop policy if exists "competitors_admin_all" on public.competitors;
create policy "competitors_admin_all" on public.competitors
  for all using (public.is_admin()) with check (public.is_admin());
