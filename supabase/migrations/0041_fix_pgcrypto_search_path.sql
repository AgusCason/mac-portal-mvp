-- ============================================================================
-- Fix — "function pgp_sym_encrypt(text, text) does not exist"
--
-- En proyectos de Supabase, la extensión pgcrypto se instala por defecto en
-- el schema `extensions`, no en `public`. Todas las funciones que cifran/
-- descifran secretos (Bóveda, tokens de redes sociales conectadas, y ahora
-- Herramientas) están declaradas con `security definer set search_path =
-- public` — ese search_path NO incluye `extensions`, entonces al llamar
-- `pgp_sym_encrypt`/`pgp_sym_decrypt` (que viven ahí) Postgres no las
-- encuentra y tira ese error. Esto ya venía roto desde 0013_vault.sql; recién
-- se nota ahora porque es la primera vez que se intenta guardar algo cifrado.
--
-- El fix agrega el schema real de pgcrypto (se detecta en runtime, no se
-- asume "extensions" a las piñas) al search_path de cada función afectada,
-- sin tocar su lógica.
-- ============================================================================

do $$
declare
  v_schema text;
  v_fn text;
begin
  select n.nspname into v_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if v_schema is null then
    raise exception 'La extensión pgcrypto no está instalada — correr antes: create extension pgcrypto;';
  end if;

  if v_schema <> 'public' then
    foreach v_fn in array array[
      'public.vault_add_credential(text, text, text, text, text, uuid, text)',
      'public.vault_update_credential(uuid, text, text, text, text, text, uuid, text)',
      'public.vault_reveal_credential(uuid, text)',
      'public.social_account_store_token(uuid, text, text)',
      'public.social_account_reveal_token(uuid, text)',
      'public.agency_tool_create(text, text, text, text, text, text, text)',
      'public.agency_tool_update(uuid, text, text, text, text, text, text, text)',
      'public.agency_tool_reveal_password(uuid, text)'
    ]
    loop
      -- Cada función se ajusta por separado: si alguna todavía no existe en
      -- esta base (ej. una migración anterior no corrida), se avisa y se
      -- sigue con el resto en vez de abortar todo el fix.
      begin
        execute format('alter function %s set search_path = public, %I', v_fn, v_schema);
      exception when undefined_function then
        raise notice 'Se salteó % — la función no existe en esta base todavía.', v_fn;
      end;
    end loop;
  end if;
end $$;
