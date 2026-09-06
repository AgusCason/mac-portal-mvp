-- ============================================================================
-- MAC Portal — Finanzas de Equipo (pago por editor y por cliente asignado) +
-- Herramientas de la agencia (accesos compartibles con el equipo).
--
-- 1) FINANZAS DE EQUIPO
--    Cada editor puede cobrar distinto por cada cliente que tiene asignado,
--    aunque el trabajo sea similar — el monto/frecuencia queda como parte de
--    la propia asignación (`editor_client_assignments`, no una tabla aparte)
--    porque conceptualmente es UN dato más de "qué significa que este editor
--    esté en este cliente", igual que `can_view_chat`/`can_view_drive`.
--
--    El HISTORIAL de pagos concretos (qué se le pagó, qué falta pagar) es una
--    tabla aparte (`editor_payouts`): el admin carga cada pago a mano —tanto
--    los ya efectuados como los que quedan pendientes con su fecha
--    esperada—, nunca se generan solos. Así el editor puede ver "cuánto me
--    pagaron", "cuándo me van a pagar" y "cuánto voy a cobrar" sin que haga
--    falta ningún proceso automático corriendo en segundo plano.
--
-- 2) HERRAMIENTAS DE LA AGENCIA
--    Catálogo de apps/servicios que usa la agencia (`agency_tools`) con sus
--    credenciales cifradas (mismo esquema pgcrypto que la Bóveda de
--    0013_vault.sql), más una tabla de "a quién se lo compartí"
--    (`agency_tool_access`). A diferencia de la Bóveda (100% admin), acá el
--    editor SÍ puede leer la contraseña de una herramienta que le compartieron
--    — por eso son funciones y tablas nuevas, no una extensión de vault_*.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. FINANZAS DE EQUIPO
-- ---------------------------------------------------------------------------

do $$ begin
  create type editor_pay_frequency as enum ('mensual', 'quincenal', 'unico', 'por_entrega');
exception when duplicate_object then null; end $$;

do $$ begin
  create type editor_payout_status as enum ('pendiente', 'pagado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type editor_payout_method as enum (
    'transferencia', 'mercadopago', 'paypal', 'payoneer', 'efectivo', 'crypto', 'otro'
  );
exception when duplicate_object then null; end $$;

alter table public.editor_client_assignments
  add column if not exists pay_amount numeric(12, 2),
  add column if not exists pay_currency text not null default 'ARS',
  add column if not exists pay_frequency editor_pay_frequency,
  add column if not exists pay_day smallint,
  add column if not exists pay_notes text;

alter table public.editor_client_assignments
  drop constraint if exists editor_client_assignments_pay_day_check;
alter table public.editor_client_assignments
  add constraint editor_client_assignments_pay_day_check
  check (pay_day is null or (pay_day between 1 and 31));

create table if not exists public.editor_payouts (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid not null references public.profiles (id) on delete cascade,
  -- Nulo = pago que no corresponde a un cliente puntual (ej. bono, ajuste).
  client_id uuid references public.clients (id) on delete set null,
  amount numeric(12, 2) not null,
  currency text not null default 'ARS',
  method editor_payout_method,
  status editor_payout_status not null default 'pendiente',
  -- Etiqueta libre del período que cubre (ej. "Agosto 2026") — solo para
  -- mostrar, no se usa para agrupar/calcular nada.
  period_label text,
  due_date date not null,
  paid_at timestamptz,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists editor_payouts_editor_due_idx
  on public.editor_payouts (editor_id, due_date desc);
create index if not exists editor_payouts_client_idx
  on public.editor_payouts (client_id);

alter table public.editor_payouts enable row level security;

drop policy if exists "editor_payouts_admin_all" on public.editor_payouts;
create policy "editor_payouts_admin_all" on public.editor_payouts
  for all using (public.is_admin()) with check (public.is_admin());

-- El editor ve SU PROPIO historial — nunca el de sus compañeros.
drop policy if exists "editor_payouts_editor_select" on public.editor_payouts;
create policy "editor_payouts_editor_select" on public.editor_payouts
  for select using (editor_id = auth.uid());

drop trigger if exists set_updated_at on public.editor_payouts;
create trigger set_updated_at before update on public.editor_payouts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. HERRAMIENTAS DE LA AGENCIA
-- ---------------------------------------------------------------------------

create table if not exists public.agency_tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  purpose text,
  url text,
  account_email text,
  account_password_encrypted bytea,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agency_tools enable row level security;

drop policy if exists "agency_tools_admin_all" on public.agency_tools;
create policy "agency_tools_admin_all" on public.agency_tools
  for all using (public.is_admin()) with check (public.is_admin());

-- El editor solo ve las herramientas que efectivamente le compartieron.
drop policy if exists "agency_tools_editor_select" on public.agency_tools;
create policy "agency_tools_editor_select" on public.agency_tools
  for select using (
    exists (
      select 1 from public.agency_tool_access
      where agency_tool_access.tool_id = agency_tools.id and agency_tool_access.editor_id = auth.uid()
    )
  );

drop trigger if exists set_updated_at on public.agency_tools;
create trigger set_updated_at before update on public.agency_tools
  for each row execute function public.set_updated_at();

create table if not exists public.agency_tool_access (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.agency_tools (id) on delete cascade,
  editor_id uuid not null references public.profiles (id) on delete cascade,
  granted_by uuid references public.profiles (id),
  granted_at timestamptz not null default now(),
  unique (tool_id, editor_id)
);

create index if not exists agency_tool_access_editor_idx on public.agency_tool_access (editor_id);

alter table public.agency_tool_access enable row level security;

drop policy if exists "agency_tool_access_admin_all" on public.agency_tool_access;
create policy "agency_tool_access_admin_all" on public.agency_tool_access
  for all using (public.is_admin()) with check (public.is_admin());

-- El editor ve SUS PROPIAS filas de acceso (para saber qué le compartieron,
-- y porque la policy de arriba de agency_tools depende de este select).
drop policy if exists "agency_tool_access_editor_select" on public.agency_tool_access;
create policy "agency_tool_access_editor_select" on public.agency_tool_access
  for select using (editor_id = auth.uid());

-- El secreto se cifra/descifra dentro de estas funciones (mismo patrón que
-- vault_add_credential/vault_reveal_credential de 0013_vault.sql) — nunca
-- viaja en texto plano por una policy de insert/update normal.

create or replace function public.agency_tool_create(
  p_name text,
  p_purpose text,
  p_url text,
  p_account_email text,
  p_password text,
  p_notes text,
  p_passphrase text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.agency_tools (name, purpose, url, account_email, account_password_encrypted, notes, created_by)
  values (
    p_name, p_purpose, p_url, p_account_email,
    case when p_password is not null and p_password <> '' then pgp_sym_encrypt(p_password, p_passphrase) else null end,
    p_notes, auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.agency_tool_update(
  p_id uuid,
  p_name text,
  p_purpose text,
  p_url text,
  p_account_email text,
  p_new_password text,
  p_notes text,
  p_passphrase text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.agency_tools
  set
    name = p_name,
    purpose = p_purpose,
    url = p_url,
    account_email = p_account_email,
    notes = p_notes,
    updated_at = now(),
    -- Si no mandan contraseña nueva, se conserva la ya guardada.
    account_password_encrypted = case
      when p_new_password is not null and p_new_password <> '' then pgp_sym_encrypt(p_new_password, p_passphrase)
      else account_password_encrypted
    end
  where id = p_id;
end;
$$;

-- A diferencia de vault_reveal_credential (100% admin), acá también puede
-- descifrar un editor al que le compartieron esta herramienta puntual — es
-- la excepción explícita que hace posible que su card muestre la contraseña.
create or replace function public.agency_tool_reveal_password(
  p_id uuid,
  p_passphrase text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_password text;
  v_encrypted bytea;
begin
  if not (
    public.is_admin()
    or exists (
      select 1 from public.agency_tool_access
      where tool_id = p_id and editor_id = auth.uid()
    )
  ) then
    raise exception 'No autorizado';
  end if;

  select account_password_encrypted into v_encrypted
  from public.agency_tools
  where id = p_id;

  if v_encrypted is null then
    return null;
  end if;

  v_password := pgp_sym_decrypt(v_encrypted, p_passphrase);
  return v_password;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Módulos nuevos en el catálogo (Configuración > Módulos) — on por defecto.
-- ---------------------------------------------------------------------------
insert into public.module_flags (key)
values ('finanzas-equipo'), ('herramientas')
on conflict (key) do nothing;
