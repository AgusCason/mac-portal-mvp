-- Métodos de cobro de la agencia (Configuración > Planes y facturación >
-- Métodos de cobro) — Nivel 1 pedido por el admin: un link de pago generado
-- a mano en el dashboard de cada plataforma (PayPal / Mercado Pago /
-- Payoneer, las tres tienen esa opción sin código) más los datos de
-- transferencia bancaria, fijos para toda la agencia (no varían por
-- cliente) y separados por moneda porque los campos que hay que mostrar son
-- distintos: CBU/alias para Argentina (ARS), cuenta + routing/SWIFT para
-- transferencias internacionales (USD).
--
-- Las columnas `api_*_encrypted` quedan creadas pero sin usar: son el punto
-- de extensión para un Nivel 2 futuro (checkout dinámico vía API +
-- confirmación automática por webhook, como ya anticipaba el comentario en
-- createInvoiceAction de src/app/actions/billing.ts) — así, cuando se
-- implemente, no hace falta otra migración para agregar las columnas.

do $$ begin
  create type payment_method_kind as enum (
    'paypal', 'mercadopago', 'payoneer', 'transferencia_ars', 'transferencia_usd'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.payment_methods (
  kind payment_method_kind primary key,
  enabled boolean not null default false,

  -- Nivel 1: link de pago generado a mano (paypal.me / Payment Links, Mercado
  -- Pago Checkout Pro, Payoneer Payment Request). Vacío hasta que el admin lo
  -- carga en Configuración.
  payment_link text,

  -- Transferencia — datos comunes
  account_holder text,

  -- Transferencia — Argentina (ARS)
  cuit text,
  cbu text,
  alias text,

  -- Transferencia — internacional (USD)
  bank_name text,
  bank_address text,
  account_number text,
  routing_number text,
  swift_bic text,

  -- Nivel 2 (futuro, sin usar todavía) — credenciales de API por plataforma.
  api_key_encrypted text,
  api_secret_encrypted text,

  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

alter table public.payment_methods enable row level security;

-- Mismo criterio que billing_invoices: el editor no tiene ni lectura acá
-- (son datos financieros), admin y cliente sí.
drop policy if exists "payment_methods_select_admin_or_client" on public.payment_methods;
create policy "payment_methods_select_admin_or_client" on public.payment_methods
  for select using (public.current_role() in ('admin', 'client'));

drop policy if exists "payment_methods_admin_write" on public.payment_methods;
create policy "payment_methods_admin_write" on public.payment_methods
  for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists set_updated_at on public.payment_methods;
create trigger set_updated_at before update on public.payment_methods
  for each row execute function public.set_updated_at();

insert into public.payment_methods (kind)
values ('paypal'), ('mercadopago'), ('payoneer'), ('transferencia_ars'), ('transferencia_usd')
on conflict (kind) do nothing;

-- RPC para que el cliente avise "ya pagué/transferí" desde /client/facturas
-- sin darle INSERT directo sobre activity_events/notifications (ninguna de
-- las dos tiene policy de insert — mismo patrón que notify_admins /
-- notify_client_members en 0009_activity_notifications.sql). Verifica que la
-- factura sea de un cliente al que el usuario pertenece (client_has_access)
-- y que siga pendiente/atrasada antes de avisar — evita spam sobre facturas
-- ya pagadas o canceladas.
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

  return true;
end;
$$;
