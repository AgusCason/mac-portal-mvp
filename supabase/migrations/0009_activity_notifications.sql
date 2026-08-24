-- ============================================================================
-- MAC Portal — Fase 1.2 de la adaptación "estilo MB Suite": feed de
-- Actividad global + Notificaciones personales, expuestos como paneles
-- deslizantes desde cualquier pantalla (ver components/shared/activity-panel.tsx
-- y notifications-panel.tsx).
--
-- Diseño: en vez de instrumentar cada Server Action para que además escriba
-- en "activity_events"/"notifications" (fácil de olvidar en el futuro), se
-- usan TRIGGERS sobre las tablas de negocio que ya existen. Así ningún
-- cambio de estado relevante se "pierde" sin quedar registrado, sin importar
-- qué código lo haya disparado (Server Action, RPC, futura integración).
--
-- Seguridad: ni activity_events ni notifications tienen policy de INSERT —
-- solo los triggers (funciones security definer, dueñas de las privilegios
-- del owner) pueden escribir. Ningún usuario autenticado puede insertar un
-- evento o notificación falsa a mano.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. activity_events — bitácora del workspace (equivalente a Management >
--    Actividad de MB Suite). client_id siempre presente en v1 (todos los
--    eventos actuales están ligados a un cliente).
-- ---------------------------------------------------------------------------
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_events_client on public.activity_events (client_id, created_at desc);
create index if not exists idx_activity_events_created on public.activity_events (created_at desc);

alter table public.activity_events enable row level security;

drop policy if exists "activity_events_admin_select" on public.activity_events;
create policy "activity_events_admin_select" on public.activity_events
  for select using (public.is_admin());

drop policy if exists "activity_events_editor_select" on public.activity_events;
create policy "activity_events_editor_select" on public.activity_events
  for select using (client_id is not null and public.editor_has_client(client_id));

drop policy if exists "activity_events_member_select" on public.activity_events;
create policy "activity_events_member_select" on public.activity_events
  for select using (client_id is not null and public.client_has_access(client_id));

-- ---------------------------------------------------------------------------
-- 2. notifications — por destinatario (profile_id), estilo campana del navbar.
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_profile on public.notifications (profile_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications (profile_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_owner_select" on public.notifications;
create policy "notifications_owner_select" on public.notifications
  for select using (profile_id = auth.uid());

drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update" on public.notifications
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Helpers security definer para disparar notificaciones desde los triggers
-- ---------------------------------------------------------------------------
create or replace function public.notify_admins(p_title text, p_body text, p_link text default null)
returns void language plpgsql security definer set search_path = public
as $$
begin
  insert into public.notifications (profile_id, title, body, link)
  select id, p_title, p_body, p_link from public.profiles where role = 'admin';
end;
$$;

create or replace function public.notify_client_members(p_client_id uuid, p_title text, p_body text, p_link text default null)
returns void language plpgsql security definer set search_path = public
as $$
begin
  insert into public.notifications (profile_id, title, body, link)
  select profile_id, p_title, p_body, p_link from public.client_members where client_id = p_client_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Triggers de negocio
-- ---------------------------------------------------------------------------

-- content_items: alta + cambio de estado -> Actividad; y notificación
-- puntual cuando el estado le toca a "la otra parte" (cliente cuando hay
-- algo para revisar; admins cuando el cliente ya decidió).
create or replace function public.trg_content_items_activity()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.activity_events (client_id, actor_id, event_type, summary)
    values (new.client_id, new.created_by, 'content_created', 'Se creó la pieza "' || new.title || '"');
    return new;
  end if;

  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.activity_events (client_id, actor_id, event_type, summary)
    values (new.client_id, null, 'content_status_changed',
      'La pieza "' || new.title || '" pasó a ' || replace(new.status::text, '_', ' '));

    if new.status = 'por_aprobar' then
      perform public.notify_client_members(new.client_id, 'Nueva pieza para revisar',
        '"' || new.title || '" está lista para tu aprobación.', '/client/calendario');
    elsif new.status in ('aprobado', 'requiere_cambios') then
      perform public.notify_admins(
        case when new.status = 'aprobado' then 'Pieza aprobada' else 'El cliente pidió cambios' end,
        '"' || new.title || '"', '/admin/calendario');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists content_items_activity on public.content_items;
create trigger content_items_activity
  after insert or update on public.content_items
  for each row execute function public.trg_content_items_activity();

-- performance_reports: publicación -> Actividad + notifica al cliente.
create or replace function public.trg_reports_activity()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status and new.status = 'published') then
    insert into public.activity_events (client_id, actor_id, event_type, summary)
    values (new.client_id, new.generated_by, 'report_published', 'Se publicó el reporte "' || new.title || '"');

    perform public.notify_client_members(new.client_id, 'Nuevo reporte disponible',
      '"' || new.title || '" ya está publicado.', '/client/reportes');
  end if;
  return new;
end;
$$;

drop trigger if exists performance_reports_activity on public.performance_reports;
create trigger performance_reports_activity
  after update on public.performance_reports
  for each row execute function public.trg_reports_activity();

-- contracts: firma -> Actividad + notifica a los admins.
create or replace function public.trg_contracts_activity()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status and new.status = 'firmado') then
    insert into public.activity_events (client_id, actor_id, event_type, summary)
    values (new.client_id, null, 'contract_signed', 'Se firmó el contrato "' || new.title || '"');

    perform public.notify_admins('Contrato firmado', '"' || new.title || '"', '/admin/contratos');
  end if;
  return new;
end;
$$;

drop trigger if exists contracts_activity on public.contracts;
create trigger contracts_activity
  after update on public.contracts
  for each row execute function public.trg_contracts_activity();

-- billing_invoices: pago registrado -> Actividad (la alerta de morosidad ya
-- existe por separado, ver 0007_notifications.sql + cron).
create or replace function public.trg_invoices_activity()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status and new.status = 'paid') then
    insert into public.activity_events (client_id, actor_id, event_type, summary)
    values (new.client_id, new.marked_paid_by, 'invoice_paid',
      'Se marcó como pagada una factura de ' || new.amount || ' ' || new.currency);
  end if;
  return new;
end;
$$;

drop trigger if exists billing_invoices_activity on public.billing_invoices;
create trigger billing_invoices_activity
  after update on public.billing_invoices
  for each row execute function public.trg_invoices_activity();

-- clients: alta -> Actividad (agencia + queda scoped a ese cliente también).
create or replace function public.trg_clients_activity()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.activity_events (client_id, actor_id, event_type, summary)
  values (new.id, new.created_by, 'client_created', 'Se creó el cliente "' || new.name || '"');
  return new;
end;
$$;

drop trigger if exists clients_activity on public.clients;
create trigger clients_activity
  after insert on public.clients
  for each row execute function public.trg_clients_activity();
