-- Registro de auditoría de acciones financieras/sensibles (Configuración >
-- Auditoría) — mismo criterio de nombres que ai_audit_log (0004_ai_assistant.sql):
-- action_type / target_table / target_id / summary / diff jsonb. A
-- diferencia de activity_events (bitácora que ve el cliente/editor sobre SU
-- propio cliente), esto es exclusivamente para el admin — quién marcó una
-- factura como pagada, quién editó los datos de cobro, quién vio o tocó una
-- credencial de la Bóveda.
--
-- Todo insert pasa por `log_audit()` (SECURITY DEFINER) desde triggers o
-- desde las funciones de la Bóveda que ya existían — nunca un insert directo
-- del cliente autenticado (mismo patrón que activity_events/notifications).

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action_type text not null,
  target_table text not null,
  target_id text,
  client_id uuid references public.clients (id) on delete set null,
  summary text not null,
  diff jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_created on public.audit_log (created_at desc);
create index if not exists idx_audit_log_actor on public.audit_log (actor_id);
create index if not exists idx_audit_log_target on public.audit_log (target_table, target_id);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_admin_select" on public.audit_log;
create policy "audit_log_admin_select" on public.audit_log
  for select using (public.is_admin());

create or replace function public.log_audit(
  p_action_type text,
  p_target_table text,
  p_target_id text,
  p_summary text,
  p_client_id uuid default null,
  p_diff jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, action_type, target_table, target_id, client_id, summary, diff)
  values (auth.uid(), p_action_type, p_target_table, p_target_id, p_client_id, p_summary, p_diff);
end;
$$;

-- ---------------------------------------------------------------------------
-- billing_invoices: alta, cambio de estado (pagada/cancelada) y edición de
-- monto. Separado de trg_invoices_activity (0009) a propósito — esto es el
-- log de seguridad para el admin, aquel es la bitácora que ve el cliente.
-- ---------------------------------------------------------------------------
create or replace function public.trg_invoices_audit()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.log_audit(
      'invoice.created', 'billing_invoices', new.id::text,
      'Se creó una factura de ' || new.amount || ' ' || new.currency,
      new.client_id,
      jsonb_build_object('amount', new.amount, 'currency', new.currency, 'method', new.method)
    );
    return new;
  end if;

  if (tg_op = 'UPDATE') then
    if (new.status is distinct from old.status) then
      perform public.log_audit(
        case new.status
          when 'paid' then 'invoice.marked_paid'
          when 'cancelled' then 'invoice.cancelled'
          else 'invoice.status_changed'
        end,
        'billing_invoices', new.id::text,
        'Factura de ' || new.amount || ' ' || new.currency || ' pasó de ' || old.status || ' a ' || new.status,
        new.client_id,
        jsonb_build_object('from', old.status, 'to', new.status)
      );
    end if;

    if (new.amount is distinct from old.amount) then
      perform public.log_audit(
        'invoice.amount_changed', 'billing_invoices', new.id::text,
        'Se editó el monto de una factura: ' || old.amount || ' → ' || new.amount || ' ' || new.currency,
        new.client_id,
        jsonb_build_object('from', old.amount, 'to', new.amount)
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists billing_invoices_audit on public.billing_invoices;
create trigger billing_invoices_audit
  after insert or update on public.billing_invoices
  for each row execute function public.trg_invoices_audit();

-- ---------------------------------------------------------------------------
-- payment_methods: quién prendió/apagó o editó un método de cobro. No
-- guarda los valores de CBU/cuenta en el diff (evita duplicar el dato
-- sensible en dos tablas) — solo si cambiaron o no.
-- ---------------------------------------------------------------------------
create or replace function public.trg_payment_methods_audit()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  perform public.log_audit(
    'payment_method.updated', 'payment_methods', new.kind::text,
    'Se actualizó el método de cobro "' || new.kind || '"',
    null,
    jsonb_build_object(
      'enabled_from', old.enabled, 'enabled_to', new.enabled,
      'payment_link_changed', old.payment_link is distinct from new.payment_link,
      'transfer_details_changed', (
        old.account_holder is distinct from new.account_holder or
        old.cuit is distinct from new.cuit or
        old.cbu is distinct from new.cbu or
        old.alias is distinct from new.alias or
        old.bank_name is distinct from new.bank_name or
        old.bank_address is distinct from new.bank_address or
        old.account_number is distinct from new.account_number or
        old.routing_number is distinct from new.routing_number or
        old.swift_bic is distinct from new.swift_bic
      )
    )
  );
  return new;
end;
$$;

drop trigger if exists payment_methods_audit on public.payment_methods;
create trigger payment_methods_audit
  after update on public.payment_methods
  for each row execute function public.trg_payment_methods_audit();

-- ---------------------------------------------------------------------------
-- vault_credentials: alta/edición vía las funciones (ya eran SECURITY
-- DEFINER, se redefinen para sumar el log) + un trigger para el delete (que
-- pasa directo por RLS, no por una función). Revelar el secreto
-- (vault_reveal_credential) es la acción más sensible de las tres — queda
-- registrada con quién y cuándo, no con qué (el secreto en sí nunca se
-- guarda en el log).
-- ---------------------------------------------------------------------------
create or replace function public.vault_add_credential(
  p_label text,
  p_username text,
  p_secret text,
  p_url text,
  p_notes text,
  p_client_id uuid,
  p_passphrase text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.vault_credentials (label, username, secret_encrypted, url, notes, client_id, created_by)
  values (p_label, p_username, pgp_sym_encrypt(p_secret, p_passphrase), p_url, p_notes, p_client_id, auth.uid())
  returning id into v_id;

  perform public.log_audit(
    'vault.credential_created', 'vault_credentials', v_id::text,
    'Se agregó la credencial "' || p_label || '" a la Bóveda',
    p_client_id
  );

  return v_id;
end;
$$;

create or replace function public.vault_update_credential(
  p_id uuid,
  p_label text,
  p_username text,
  p_new_secret text,
  p_url text,
  p_notes text,
  p_client_id uuid,
  p_passphrase text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.vault_credentials
  set
    label = p_label,
    username = p_username,
    url = p_url,
    notes = p_notes,
    client_id = p_client_id,
    updated_at = now(),
    -- Si no mandan un secreto nuevo, se conserva el cifrado existente.
    secret_encrypted = case
      when p_new_secret is not null and p_new_secret <> '' then pgp_sym_encrypt(p_new_secret, p_passphrase)
      else secret_encrypted
    end
  where id = p_id;

  perform public.log_audit(
    'vault.credential_updated', 'vault_credentials', p_id::text,
    'Se editó la credencial "' || p_label || '" de la Bóveda',
    p_client_id,
    jsonb_build_object('secret_rotated', p_new_secret is not null and p_new_secret <> '')
  );
end;
$$;

create or replace function public.vault_reveal_credential(
  p_id uuid,
  p_passphrase text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_secret text;
  v_label text;
  v_client_id uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select pgp_sym_decrypt(secret_encrypted, p_passphrase), label, client_id
  into v_secret, v_label, v_client_id
  from public.vault_credentials
  where id = p_id;

  perform public.log_audit(
    'vault.credential_revealed', 'vault_credentials', p_id::text,
    'Se reveló el secreto de la credencial "' || coalesce(v_label, '—') || '"',
    v_client_id
  );

  return v_secret;
end;
$$;

create or replace function public.trg_vault_credentials_audit_delete()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  perform public.log_audit(
    'vault.credential_deleted', 'vault_credentials', old.id::text,
    'Se eliminó la credencial "' || old.label || '" de la Bóveda',
    old.client_id
  );
  return old;
end;
$$;

drop trigger if exists vault_credentials_audit_delete on public.vault_credentials;
create trigger vault_credentials_audit_delete
  after delete on public.vault_credentials
  for each row execute function public.trg_vault_credentials_audit_delete();

-- ---------------------------------------------------------------------------
-- report_invoice_payment (0025_payment_methods.sql): se redefine para que el
-- aviso del cliente también quede en el log de auditoría, no solo en
-- activity_events + la notificación al admin.
-- ---------------------------------------------------------------------------
create or replace function public.report_invoice_payment(
  target_invoice_id uuid,
  p_method text default null
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  inv record;
begin
  select id, client_id, amount, currency, status
  into inv
  from public.billing_invoices
  where id = target_invoice_id;

  if inv.id is null or not public.client_has_access(inv.client_id) then
    return false;
  end if;

  if inv.status not in ('pending', 'overdue') then
    return false;
  end if;

  insert into public.activity_events (client_id, actor_id, event_type, summary)
  values (
    inv.client_id,
    auth.uid(),
    'invoice_payment_reported',
    'El cliente avisó que pagó una factura de ' || inv.amount || ' ' || inv.currency ||
      coalesce(' vía ' || p_method, '')
  );

  perform public.notify_admins(
    'Un cliente avisó un pago',
    'Factura de ' || inv.amount || ' ' || inv.currency || coalesce(' vía ' || p_method, '') ||
      ' — revisar y conciliar en Planes y facturación.',
    '/admin/planes'
  );

  perform public.log_audit(
    'invoice.payment_reported', 'billing_invoices', inv.id::text,
    'El cliente avisó un pago de ' || inv.amount || ' ' || inv.currency || coalesce(' vía ' || p_method, ''),
    inv.client_id
  );

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Gobernanza de módulos: la nueva pantalla /admin/configuracion/auditoria
-- necesita su key en module_flags para que Configuración > Módulos la pueda
-- apagar (mismo criterio que el backfill de 0022_module_flags_backfill.sql).
-- ---------------------------------------------------------------------------
insert into public.module_flags (key)
values ('config-auditoria')
on conflict (key) do nothing;
