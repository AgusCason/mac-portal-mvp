-- ============================================================================
-- MAC Portal — Fase "Cuentas" de la adaptación "estilo MB Suite" (más allá
-- del roadmap original de 3 fases). Transforma la sección Clientes en Cuentas
-- (mismos datos reales de `clients`, presentación en tarjetas tipo MB Suite):
-- agrega la posibilidad de marcar una cuenta como favorita, por admin, para
-- que aparezca destacada arriba del todo en la vista de Cuentas — análogo a
-- "Marca clientes como favoritos para verlos aquí" del Overview de MB Suite.
-- ============================================================================

create table if not exists public.client_favorites (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, client_id)
);

create index if not exists idx_client_favorites_profile on public.client_favorites (profile_id);

alter table public.client_favorites enable row level security;

-- Cada admin ve y administra únicamente sus propios favoritos.
drop policy if exists "client_favorites_owner_select" on public.client_favorites;
create policy "client_favorites_owner_select" on public.client_favorites
  for select using (profile_id = auth.uid());

drop policy if exists "client_favorites_owner_insert" on public.client_favorites;
create policy "client_favorites_owner_insert" on public.client_favorites
  for insert with check (profile_id = auth.uid() and public.is_admin());

drop policy if exists "client_favorites_owner_delete" on public.client_favorites;
create policy "client_favorites_owner_delete" on public.client_favorites
  for delete using (profile_id = auth.uid());
