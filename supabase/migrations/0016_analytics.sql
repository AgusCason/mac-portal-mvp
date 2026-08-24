-- ============================================================================
-- MAC Portal — Fase "Analytics" de la adaptación "estilo MB Suite": agrega
-- la sección Analytics (Overview/Monitors/Dashboards/Explorer/Reports/
-- Alertas/Envíos/UTM Builder). La mayoría de estas sub-secciones reusan
-- tablas que ya existían (social_accounts, social_metrics, metric_alerts,
-- performance_reports) — la única pieza de datos nueva es UTM Builder.
--
-- utm_links: historial de URLs con parámetros UTM generadas desde Analytics
-- > UTM Builder, para poder reutilizar/copiar una campaña armada antes. Sin
-- vínculo obligatorio a un cliente (una URL de campaña puede ser genérica de
-- la agencia).
-- ============================================================================

create table if not exists public.utm_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  base_url text not null,
  utm_source text not null,
  utm_medium text not null,
  utm_campaign text not null,
  utm_term text,
  utm_content text,
  generated_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_utm_links_created on public.utm_links (created_at desc);

alter table public.utm_links enable row level security;

-- Mismo criterio que el resto de Analytics: solo la agencia (admin) arma y ve
-- las campañas UTM.
drop policy if exists "utm_links_admin_select" on public.utm_links;
create policy "utm_links_admin_select" on public.utm_links
  for select using (public.is_admin());

drop policy if exists "utm_links_admin_insert" on public.utm_links;
create policy "utm_links_admin_insert" on public.utm_links
  for insert with check (public.is_admin());

drop policy if exists "utm_links_admin_delete" on public.utm_links;
create policy "utm_links_admin_delete" on public.utm_links
  for delete using (public.is_admin());
