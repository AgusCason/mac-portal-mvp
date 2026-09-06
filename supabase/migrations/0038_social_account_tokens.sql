-- ============================================================================
-- MAC Portal — cifrado del access token de Instagram/Facebook por cuenta
-- social conectada.
--
-- `social_accounts.access_token_encrypted` ya existía desde 0001_schema.sql
-- pero no tenía ninguna función que lo escribiera ni lo leyera — el flujo de
-- conexión (OAuth de Meta, /api/oauth/meta/callback) quedaba con el token de
-- larga duración en la mano y ningún lugar seguro donde dejarlo. Mismo
-- patrón que la bóveda de credenciales (0013_vault.sql): pgcrypto,
-- SECURITY DEFINER, is_admin() chequeado a mano (el cifrado ocurre adentro
-- de la función, no se puede expresar como policy RLS), passphrase nunca
-- guardada en la base — viaja como argumento en cada llamada, provista por
-- el server desde META_TOKEN_ENCRYPTION_KEY (con fallback a
-- VAULT_ENCRYPTION_KEY si no se definió una key aparte — ver
-- src/lib/meta.ts).
--
-- Única diferencia real con el patrón de la bóveda: `secret_encrypted` de
-- vault_credentials es `bytea`, pero `access_token_encrypted` ya se declaró
-- `text` en 0001 — pgp_sym_encrypt devuelve bytea, así que acá se guarda
-- codificado en base64 (encode/decode) para que entre en la columna text
-- existente sin tener que migrarla.
-- ============================================================================

create or replace function public.social_account_store_token(
  p_id uuid,
  p_token text,
  p_passphrase text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.social_accounts
  set access_token_encrypted = encode(pgp_sym_encrypt(p_token, p_passphrase), 'base64')
  where id = p_id;
end;
$$;

create or replace function public.social_account_reveal_token(
  p_id uuid,
  p_passphrase text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_token text;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select pgp_sym_decrypt(decode(access_token_encrypted, 'base64'), p_passphrase) into v_token
  from public.social_accounts
  where id = p_id;

  return v_token;
end;
$$;

-- Una cuenta por plataforma por cliente — si el admin reconecta Instagram
-- (token vencido, cambio de página de Facebook), el callback actualiza la
-- fila existente en vez de dejar duplicados sueltos en /admin/redes.
create unique index if not exists social_accounts_client_platform_idx
  on public.social_accounts (client_id, platform);
