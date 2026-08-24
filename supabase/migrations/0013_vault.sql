-- ============================================================================
-- MAC Portal — Fase 3.3 de la adaptación "estilo MB Suite": bóveda de
-- credenciales cifradas (equivalente a Configuración > Bóveda). Guarda
-- accesos técnicos (paneles de Ads, dominios, hosting, etc.), opcionalmente
-- vinculados a un cliente.
--
-- Modelo de cifrado: el secreto se cifra con pgcrypto (pgp_sym_encrypt) y se
-- guarda como bytea — nunca en texto plano. La passphrase NO vive en la base:
-- viaja como argumento en cada llamada, provista por el server (variable de
-- entorno VAULT_ENCRYPTION_KEY, ver .env.example), así que ni siquiera un
-- dump de la base alcanza para leer los secretos sin esa key. Las funciones
-- son SECURITY DEFINER + chequean is_admin() a mano porque el cifrado ocurre
-- adentro de la función (no se puede expresar como política RLS).
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.vault_credentials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  label text not null,
  username text,
  secret_encrypted bytea not null,
  url text,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vault_credentials enable row level security;

-- Solo admin ve siquiera la fila (secret_encrypted es inútil sin la key,
-- pero tampoco hace falta exponer label/usuario a nadie más).
drop policy if exists "vault_credentials_admin_select" on public.vault_credentials;
create policy "vault_credentials_admin_select" on public.vault_credentials
  for select using (public.is_admin());

drop policy if exists "vault_credentials_admin_delete" on public.vault_credentials;
create policy "vault_credentials_admin_delete" on public.vault_credentials
  for delete using (public.is_admin());

-- Insert/update pasan SIEMPRE por las funciones de abajo (necesitan cifrar
-- el secreto), así que no hace falta policy de insert/update para el rol
-- autenticado normal — las funciones son SECURITY DEFINER.

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
end;
$$;

create or replace function public.vault_reveal_credential(
  p_id uuid,
  p_passphrase text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_secret text;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select pgp_sym_decrypt(secret_encrypted, p_passphrase) into v_secret
  from public.vault_credentials
  where id = p_id;

  return v_secret;
end;
$$;
