-- ============================================================================
-- MAC Portal — bloqueo de acceso al portal para clientes Pausados/Perdidos.
--
-- Antes, marcar a un cliente como "Pausado" o "Perdido" (ver ClientStatusMenu
-- en la ficha admin, /admin/clientes/[id]) era puramente una etiqueta: lo
-- sacaba del listado "Activas" de Cuentas, pero `client_has_access()` — la
-- función que gatea TODAS las políticas RLS y RPCs de self-service del
-- cliente (contenido, contratos, facturas, chat, redes, sitios web) — no
-- miraba el status. El cliente se seguía pudiendo loguear y ver exactamente
-- lo mismo que antes.
--
-- 1) `client_has_access()` ahora exige además que `clients.status = 'active'`.
--    Es el piso real de seguridad (RLS) — como ya documenta el comentario de
--    proxy.ts sobre su cache de rol: el bloqueo a nivel de UI (ver
--    src/app/client/layout.tsx) es solo un atajo de UX, esto es lo que
--    importa de verdad. No se toca `is_admin()` ni `editor_has_client()`: un
--    admin o editor sigue viendo/gestionando los datos de un cliente
--    pausado/perdido con normalidad, solo se le corta el paso al cliente.
--
-- 2) `my_client_status()`: un cliente pausado/perdido, por definición, deja
--    de tener `client_has_access()` — incluida la policy `clients_member_
--    select`, que depende de la misma función — así que no podría leer ni
--    su propio status en `clients` para mostrarle un mensaje claro de por
--    qué no entra (el portal se vería simplemente roto/vacío en vez de
--    explicarle qué pasó). Esta función es la excepción puntual: security
--    definer, recibe el client_id que el propio caller ya resolvió como su
--    "cliente primario" (`getPrimaryClientId`), verifica que de verdad esté
--    vinculado a ese cliente vía `client_members`, y solo entonces devuelve
--    su status — nunca el de un cliente al que no pertenece.
-- ============================================================================

create or replace function public.client_has_access(target_client_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.client_members cm
    join public.clients c on c.id = cm.client_id
    where cm.profile_id = auth.uid()
      and cm.client_id = target_client_id
      and c.status = 'active'
  );
$$;

create or replace function public.my_client_status(p_client_id uuid)
returns client_status
language sql stable security definer set search_path = public as $$
  select c.status
  from public.client_members cm
  join public.clients c on c.id = cm.client_id
  where cm.profile_id = auth.uid()
    and cm.client_id = p_client_id;
$$;

grant execute on function public.my_client_status(uuid) to authenticated;
