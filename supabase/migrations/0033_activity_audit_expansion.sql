-- Amplía Configuración > Auditoría de "solo lo financiero/sensible" a "toda
-- acción que un admin pueda necesitar reconstruir sobre un usuario puntual"
-- (pedido explícito: inicios de sesión, cambios de estado en entregables —
-- piezas de contenido Y entregables de Sitios Web —, comentarios). Todo pasa
-- por el mismo `log_audit()` de 0026_audit_log.sql, así el filtro por
-- usuario que ya tiene la pantalla (?usuario=) cubre esto sin cambios en la
-- UI ni en getAuditLog().
--
-- De paso, dos bugs reales que aparecieron al mirar esto de cerca:
--  1. `trg_content_items_activity` y `trg_contracts_activity` insertaban en
--     activity_events con `actor_id = null` en los cambios de estado — nunca
--     habían quedado con quién los hizo, ni siquiera para uso futuro.
--  2. `log_audit()` no tenía ningún GRANT/REVOKE explícito, así que quedaba
--     con el EXECUTE default de Postgres a PUBLIC — cualquier usuario
--     autenticado podía en teoría invocarlo directo por RPC con action_type
--     y summary inventados por él mismo, y fabricar entradas falsas en el
--     log de auditoría. El comentario original de 0026 ya decía que esto
--     "nunca" debía pasar por un insert directo del cliente — ahora queda
--     reforzado con un REVOKE real, no solo con la intención en un comentario.

-- ---------------------------------------------------------------------------
-- 0. log_audit(): cerrar el hueco de permisos — solo triggers/funciones
--    (que corren como el owner, con privilegios propios) pueden llamarlo.
-- ---------------------------------------------------------------------------
revoke execute on function public.log_audit(text, text, text, text, uuid, jsonb)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. auth.login: no hay ninguna tabla propia sobre la que enganchar un
--    trigger (el login pasa por Supabase Auth, no por algo nuestro) — se
--    llama a mano desde loginAction() justo después de un signInWithPassword
--    exitoso. Función angosta a propósito: sin parámetros libres (nada que
--    un cliente pueda falsificar), actor y momento salen de auth.uid()/now(),
--    no de lo que mande quien la llama.
-- ---------------------------------------------------------------------------
create or replace function public.log_login_event()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  perform public.log_audit('auth.login', 'auth_sessions', auth.uid()::text, 'Inicio de sesión');
end;
$$;

grant execute on function public.log_login_event() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. content_items: mismo trigger de siempre (0009_activity_notifications.sql)
--    + ahora también log_audit() en creación y cambio de estado, con el
--    actor real (antes null en el cambio de estado).
-- ---------------------------------------------------------------------------
create or replace function public.trg_content_items_activity()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.activity_events (client_id, actor_id, event_type, summary)
    values (new.client_id, new.created_by, 'content_created', 'Se creó la pieza "' || new.title || '"');

    perform public.log_audit(
      'content.created', 'content_items', new.id::text,
      'Se creó la pieza "' || new.title || '"',
      new.client_id
    );
    return new;
  end if;

  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.activity_events (client_id, actor_id, event_type, summary)
    values (new.client_id, auth.uid(), 'content_status_changed',
      'La pieza "' || new.title || '" pasó a ' || replace(new.status::text, '_', ' '));

    perform public.log_audit(
      'content.status_changed', 'content_items', new.id::text,
      'La pieza "' || new.title || '" pasó de ' || replace(old.status::text, '_', ' ') ||
        ' a ' || replace(new.status::text, '_', ' '),
      new.client_id,
      jsonb_build_object('from', old.status, 'to', new.status)
    );

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

-- ---------------------------------------------------------------------------
-- 3. content_comments: no tenía NINGÚN trigger — un comentario sobre una
--    pieza no dejaba rastro en ningún lado.
-- ---------------------------------------------------------------------------
create or replace function public.trg_content_comments_audit()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_client_id uuid;
  v_title text;
begin
  select client_id, title into v_client_id, v_title
    from public.content_items where id = new.content_item_id;

  perform public.log_audit(
    'content.comment_added', 'content_comments', new.id::text,
    'Nuevo comentario en "' || coalesce(v_title, '—') || '"',
    v_client_id
  );
  return new;
end;
$$;

drop trigger if exists content_comments_audit on public.content_comments;
create trigger content_comments_audit
  after insert on public.content_comments
  for each row execute function public.trg_content_comments_audit();

-- ---------------------------------------------------------------------------
-- 4. web_project_assets ("entregables" de Sitios Web — mockups, links de
--    staging): tampoco tenía ningún trigger. Alta + cambio de estado
--    (aprobado/requiere_cambios, vía set_web_asset_approval en 0028).
-- ---------------------------------------------------------------------------
create or replace function public.trg_web_project_assets_audit()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_client_id uuid;
begin
  select client_id into v_client_id from public.web_projects where id = new.web_project_id;

  if (tg_op = 'INSERT') then
    perform public.log_audit(
      'web_asset.created', 'web_project_assets', new.id::text,
      'Se agregó el entregable "' || new.title || '"',
      v_client_id
    );
    return new;
  end if;

  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    perform public.log_audit(
      'web_asset.status_changed', 'web_project_assets', new.id::text,
      'El entregable "' || new.title || '" pasó a ' || replace(new.status::text, '_', ' '),
      v_client_id,
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists web_project_assets_audit on public.web_project_assets;
create trigger web_project_assets_audit
  after insert or update on public.web_project_assets
  for each row execute function public.trg_web_project_assets_audit();

-- ---------------------------------------------------------------------------
-- 5. contracts: mismo trigger de 0032_client_notifications_gap.sql + ahora
--    también log_audit() en alta y firma, con el actor real (antes null).
-- ---------------------------------------------------------------------------
create or replace function public.trg_contracts_activity()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.activity_events (client_id, actor_id, event_type, summary)
    values (new.client_id, auth.uid(), 'contract_created', 'Nuevo contrato "' || new.title || '"');

    perform public.log_audit(
      'contract.created', 'contracts', new.id::text,
      'Se creó el contrato "' || new.title || '"',
      new.client_id
    );

    perform public.notify_client_members(new.client_id, 'Nuevo contrato para firmar',
      '"' || new.title || '" está esperando tu firma.', '/client/contratos');
    return new;
  end if;

  if (tg_op = 'UPDATE' and new.status is distinct from old.status and new.status = 'firmado') then
    insert into public.activity_events (client_id, actor_id, event_type, summary)
    values (new.client_id, auth.uid(), 'contract_signed', 'Se firmó el contrato "' || new.title || '"');

    perform public.log_audit(
      'contract.signed', 'contracts', new.id::text,
      'Se firmó el contrato "' || new.title || '"',
      new.client_id
    );

    perform public.notify_admins('Contrato firmado', '"' || new.title || '"', '/admin/contratos');
  end if;
  return new;
end;
$$;

drop trigger if exists contracts_activity on public.contracts;
create trigger contracts_activity
  after insert or update on public.contracts
  for each row execute function public.trg_contracts_activity();
