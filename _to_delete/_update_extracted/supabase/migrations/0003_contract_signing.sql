-- ============================================================================
-- MAC Portal — Firma de contratos por parte del cliente
-- Ejecutar DESPUÉS de 0001_schema.sql (y 0002_seed.sql si lo usaste).
-- ============================================================================

-- RPC segura: el cliente marca un contrato propio como firmado. No puede
-- tocar título, archivo ni ningún otro campo — solo status + signed_at,
-- y solo sobre contratos donde `client_has_access` sea verdadero.
create or replace function public.sign_contract(target_contract_id uuid)
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
    set status = 'firmado', signed_at = now()
    where id = target_contract_id
    returning * into updated_row;

  return updated_row;
end;
$$;
