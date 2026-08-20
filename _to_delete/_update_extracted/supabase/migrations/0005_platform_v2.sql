-- ============================================================================
-- MAC Portal — Ampliación v2: onboarding real, facturación, reportes con IA
-- Ejecutar DESPUÉS de 0001-0004. Idempotente (se puede correr más de una vez).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. ENUMS NUEVOS
-- ---------------------------------------------------------------------------
do $$ begin
  create type invoice_status as enum ('pending', 'paid', 'overdue', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum (
    'mercadopago', 'paypal', 'transferencia', 'payoneer', 'crypto', 'otro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. CAMPOS NUEVOS EN TABLAS EXISTENTES
-- ---------------------------------------------------------------------------

-- Clients: datos del "alta integral" (país, redes, corte de facturación).
alter table public.clients
  add column if not exists country text,
  add column if not exists social_instagram text,
  add column if not exists social_tiktok text,
  add column if not exists social_facebook text,
  add column if not exists social_youtube text,
  add column if not exists social_website text,
  add column if not exists billing_cutoff_day smallint check (billing_cutoff_day between 1 and 31);

-- Plans: cupo mensual, para la barra de progreso "8/12 videos entregados".
alter table public.plans
  add column if not exists monthly_quota integer;

-- Contracts: IP + fecha de aceptación (trazabilidad legal del "Aceptar términos").
alter table public.contracts
  add column if not exists signed_ip text;

-- ---------------------------------------------------------------------------
-- 3. FACTURACIÓN (billing_invoices) — solo Admin y el propio Cliente (lectura)
-- ---------------------------------------------------------------------------
create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  plan_id uuid references public.plans (id),
  amount numeric(12, 2) not null,
  currency text not null default 'ARS',
  method payment_method not null default 'transferencia',
  status invoice_status not null default 'pending',
  due_date date not null,
  paid_at timestamptz,
  marked_paid_by uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_invoices_client on public.billing_invoices (client_id, due_date desc);
create index if not exists idx_billing_invoices_status on public.billing_invoices (status);

alter table public.billing_invoices enable row level security;

drop policy if exists "billing_invoices_admin_all" on public.billing_invoices;
create policy "billing_invoices_admin_all" on public.billing_invoices
  for all using (public.is_admin()) with check (public.is_admin());

-- Editores NO tienen policy acá — sin acceso a facturación, ni siquiera lectura.
drop policy if exists "billing_invoices_member_select" on public.billing_invoices;
create policy "billing_invoices_member_select" on public.billing_invoices
  for select using (public.client_has_access(client_id));

-- ---------------------------------------------------------------------------
-- 4. REPORTES DE RENDIMIENTO CON IA (performance_reports)
-- ---------------------------------------------------------------------------
create table if not exists public.performance_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  summary text not null default '',
  pdf_path text,
  status report_status not null default 'draft',
  generated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_performance_reports_client on public.performance_reports (client_id, created_at desc);

alter table public.performance_reports enable row level security;

drop policy if exists "performance_reports_admin_all" on public.performance_reports;
create policy "performance_reports_admin_all" on public.performance_reports
  for all using (public.is_admin()) with check (public.is_admin());

-- El cliente solo ve los reportes ya "habilitados" (status = published).
drop policy if exists "performance_reports_member_select" on public.performance_reports;
create policy "performance_reports_member_select" on public.performance_reports
  for select using (status = 'published' and public.client_has_access(client_id));

-- ---------------------------------------------------------------------------
-- 5. RPC: firma de contrato con IP (reemplaza a la de 0003, mismo nombre)
-- ---------------------------------------------------------------------------
create or replace function public.sign_contract(
  target_contract_id uuid,
  client_ip text default null
)
returns public.contracts
language plpgsql security definer set search_path = public
as $$
declare
  updated_row public.contracts;
  target_client uuid;
begin
  select client_id into target_client from public.contracts where id = target_contract_id;

  if target_client is null then
    raise exception 'Contrato no encontrado';
  end if;

  if not public.client_has_access(target_client) then
    raise exception 'No autorizado';
  end if;

  update public.contracts
    set status = 'firmado', signed_at = now(), signed_ip = client_ip
    where id = target_contract_id
    returning * into updated_row;

  return updated_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. STORAGE: bucket de avatares (público de solo-lectura, escritura propia)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
