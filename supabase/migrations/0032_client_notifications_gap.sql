-- Completa huecos de notificaciones al cliente detectados en una auditoría
-- de completitud del portal (ver 0009_activity_notifications.sql para el
-- diseño general — todo vía triggers, nunca instrumentando cada Server
-- Action a mano). Dos casos que hoy quedaban en silencio para el cliente:
--
--  1. Contrato nuevo: hoy trg_contracts_activity solo notifica a los admins
--     cuando el cliente YA firmó — nadie le avisa al cliente que hay un
--     contrato nuevo esperando su firma.
--  2. Chat: no existía ningún trigger sobre chat_messages — ni el cliente se
--     enteraba de una respuesta de la agencia, ni la agencia de un mensaje
--     nuevo del cliente (salvo que alguien tuviera la pantalla de Chat
--     abierta en ese momento).

-- ---------------------------------------------------------------------------
-- 1. contracts: alta -> notifica al cliente (además de firma -> admins, que
--    ya existía).
-- ---------------------------------------------------------------------------
create or replace function public.trg_contracts_activity()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.activity_events (client_id, actor_id, event_type, summary)
    values (new.client_id, null, 'contract_created', 'Nuevo contrato "' || new.title || '"');

    perform public.notify_client_members(new.client_id, 'Nuevo contrato para firmar',
      '"' || new.title || '" está esperando tu firma.', '/client/contratos');
    return new;
  end if;

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
  after insert or update on public.contracts
  for each row execute function public.trg_contracts_activity();

-- ---------------------------------------------------------------------------
-- 2. chat_messages: cada mensaje nuevo notifica a "la otra parte" — al
--    cliente cuando la agencia le escribe (outbound), a los admins cuando
--    escribe el cliente (inbound). No hay activity_events acá a propósito:
--    el chat ya tiene su propia pantalla como historial, no hace falta
--    duplicarlo en la bitácora general.
-- ---------------------------------------------------------------------------
create or replace function public.trg_chat_messages_notify()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_client_name text;
begin
  if new.direction = 'outbound' then
    perform public.notify_client_members(new.client_id, 'Nuevo mensaje de la agencia',
      left(new.body, 140), '/client/chat');
  else
    select name into v_client_name from public.clients where id = new.client_id;
    perform public.notify_admins('Nuevo mensaje de ' || coalesce(v_client_name, 'un cliente'),
      left(new.body, 140), '/admin/chat');
  end if;
  return new;
end;
$$;

drop trigger if exists chat_messages_notify on public.chat_messages;
create trigger chat_messages_notify
  after insert on public.chat_messages
  for each row execute function public.trg_chat_messages_notify();
