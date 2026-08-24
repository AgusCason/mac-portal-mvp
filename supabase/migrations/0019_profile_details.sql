-- ============================================================================
-- MAC Portal — Fase "Mi Perfil" de la adaptación "estilo MB Suite": agrega
-- las columnas que necesita el popup "Perfil de Cuenta" (avatar dropdown →
-- Mi Perfil), con sus 3 pestañas: Perfil de Cuenta, Preferencias,
-- Notificaciones.
--
-- Todo lo que este popup edita es SIEMPRE sobre la propia fila del usuario
-- (`profiles.id = auth.uid()`) — ya cubierto por la policy
-- "profiles_update_own" de 0001_schema.sql y el guard de rol de 0006, así
-- que no hace falta ninguna policy nueva acá.
-- ============================================================================

do $$ begin
  create type profile_theme as enum ('midnight_dark', 'modern_mix', 'pure_light', 'psychedelic');
exception when duplicate_object then null; end $$;

do $$ begin
  create type profile_language as enum ('es', 'en', 'pt');
exception when duplicate_object then null; end $$;

do $$ begin
  create type profile_number_format as enum ('es_latam', 'en_us');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists job_title text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists location text not null default '',
  add column if not exists bio text not null default '',
  add column if not exists language profile_language not null default 'es',
  add column if not exists number_format profile_number_format not null default 'es_latam',
  add column if not exists theme_preference profile_theme not null default 'modern_mix',
  add column if not exists notify_marketing boolean not null default true,
  add column if not exists notify_product_updates boolean not null default true;
