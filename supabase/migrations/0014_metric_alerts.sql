-- ============================================================================
-- MAC Portal — Fase 3.4 de la adaptación "estilo MB Suite": alertas de
-- métricas (extensión del cron existente). Cuando el alcance o los
-- seguidores de una cuenta social caen fuerte de un día para el otro, se
-- genera una notificación interna (bandeja de Notificaciones + resumen en
-- el dashboard) — NO se avisa al cliente automáticamente, es una señal para
-- que la agencia investigue primero.
--
-- `metric_alerts` guarda qué alertas ya se dispararon, para que el cron
-- (que corre todos los días) no repita el mismo aviso una y otra vez por la
-- misma caída — ver netlify/functions/notify-metric-drops.ts.
-- ============================================================================

create table if not exists public.metric_alerts (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid not null references public.social_accounts (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  metric_date date not null,
  metric_type text not null,
  previous_avg numeric not null,
  current_value numeric not null,
  drop_pct numeric not null,
  created_at timestamptz not null default now(),
  unique (social_account_id, metric_date, metric_type)
);

create index if not exists idx_metric_alerts_created on public.metric_alerts (created_at desc);

alter table public.metric_alerts enable row level security;

-- Mismo criterio que social_metrics: solo agencia (admin). El cron que
-- escribe acá usa la Service Role Key (bypassea RLS), así que no hace falta
-- policy de insert.
drop policy if exists "metric_alerts_admin_select" on public.metric_alerts;
create policy "metric_alerts_admin_select" on public.metric_alerts
  for select using (public.is_admin());
