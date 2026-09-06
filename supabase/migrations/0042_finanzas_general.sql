-- ============================================================================
-- MAC Portal — Finanzas (general): dashboard con Pago Clientes, Pago
-- Herramientas y Pago Editor en un solo lugar para el admin.
--
-- "Pago Clientes" y "Pago Editor" ya tienen todos sus datos (billing_invoices
-- y editor_payouts respectivamente) — este dashboard los reutiliza, no hace
-- falta tabla nueva. Lo que sí falta es el COSTO de cada herramienta de la
-- agencia y cuándo vence/se renueva, para poder armar "Pago Herramientas" y
-- sus alertas de vencimiento próximo.
-- ============================================================================

do $$ begin
  create type tool_cost_frequency as enum ('mensual', 'anual', 'unico');
exception when duplicate_object then null; end $$;

alter table public.agency_tools
  add column if not exists cost_amount numeric(12, 2),
  add column if not exists cost_currency text not null default 'ARS',
  add column if not exists cost_frequency tool_cost_frequency,
  add column if not exists next_renewal_date date;

-- Las funciones cambian de firma (se agregan los 4 params de costo), así que
-- se borran las versiones viejas explícitamente antes de recrearlas — si
-- solo se hiciera `create or replace` con una firma distinta, Postgres crea
-- una función SOBRECARGADA nueva en vez de reemplazar la vieja, y quedan las
-- dos dando vueltas.
drop function if exists public.agency_tool_create(text, text, text, text, text, text, text);
drop function if exists public.agency_tool_update(uuid, text, text, text, text, text, text, text);

create or replace function public.agency_tool_create(
  p_name text,
  p_purpose text,
  p_url text,
  p_account_email text,
  p_password text,
  p_notes text,
  p_cost_amount numeric,
  p_cost_currency text,
  p_cost_frequency tool_cost_frequency,
  p_next_renewal_date date,
  p_passphrase text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.agency_tools (
    name, purpose, url, account_email, account_password_encrypted, notes,
    cost_amount, cost_currency, cost_frequency, next_renewal_date, created_by
  )
  values (
    p_name, p_purpose, p_url, p_account_email,
    case when p_password is not null and p_password <> '' then pgp_sym_encrypt(p_password, p_passphrase) else null end,
    p_notes, p_cost_amount, coalesce(p_cost_currency, 'ARS'), p_cost_frequency, p_next_renewal_date, auth.uid()
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
  p_cost_amount numeric,
  p_cost_currency text,
  p_cost_frequency tool_cost_frequency,
  p_next_renewal_date date,
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
    cost_amount = p_cost_amount,
    cost_currency = coalesce(p_cost_currency, 'ARS'),
    cost_frequency = p_cost_frequency,
    next_renewal_date = p_next_renewal_date,
    updated_at = now(),
    -- Si no mandan contraseña nueva, se conserva la ya guardada.
    account_password_encrypted = case
      when p_new_password is not null and p_new_password <> '' then pgp_sym_encrypt(p_new_password, p_passphrase)
      else account_password_encrypted
    end
  where id = p_id;
end;
$$;

-- Mismo fix de 0041_fix_pgcrypto_search_path.sql, aplicado acá mismo a las
-- dos funciones recién recreadas (al recrearlas se pierde el search_path que
-- ese fix les había puesto, porque son objetos nuevos con la firma nueva).
do $$
declare
  v_schema text;
  v_fn text;
begin
  select n.nspname into v_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if v_schema is not null and v_schema <> 'public' then
    foreach v_fn in array array[
      'public.agency_tool_create(text, text, text, text, text, text, numeric, text, tool_cost_frequency, date, text)',
      'public.agency_tool_update(uuid, text, text, text, text, text, text, numeric, text, tool_cost_frequency, date, text)'
    ]
    loop
      begin
        execute format('alter function %s set search_path = public, %I', v_fn, v_schema);
      exception when undefined_function then
        raise notice 'Se salteó % — la función no existe en esta base todavía.', v_fn;
      end;
    end loop;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Módulo nuevo en el catálogo (Configuración > Módulos) — on por defecto.
-- ---------------------------------------------------------------------------
insert into public.module_flags (key)
values ('finanzas')
on conflict (key) do nothing;
