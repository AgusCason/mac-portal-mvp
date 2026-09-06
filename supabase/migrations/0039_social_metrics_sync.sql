-- ============================================================================
-- MAC Portal — sincronización de métricas de Instagram (cuenta + por
-- publicación), job automático diario.
--
-- 1) Las funciones que cifran/descifran el token de una cuenta conectada
--    (0038) solo dejaban pasar a un admin con sesión activa (`is_admin()`,
--    que lee `auth.uid()`). El job que trae las métricas corre en un Netlify
--    Scheduled Function sin sesión de usuario — llama con la Service Role
--    Key, así que `auth.uid()` da null y `is_admin()` da false, y la función
--    rechazaba la llamada. Se relaja el chequeo para aceptar también
--    `auth.role() = 'service_role'` (mismo criterio que ya usan las políticas
--    RLS del resto del proyecto para distinguir server-side de cara al público).
--
-- 2) Nueva tabla `social_media_posts`: una fila por publicación REAL de
--    Instagram con sus métricas — no confundir con `content_items`, que es
--    la grilla de contenido PLANEADO para publicar (con su propio flujo de
--    aprobación). Esta tabla es el resultado de leer la Graph API después
--    de que algo ya salió publicado.
-- ============================================================================

create or replace function public.social_account_store_token(
  p_id uuid,
  p_token text,
  p_passphrase text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
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
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'No autorizado';
  end if;

  select pgp_sym_decrypt(decode(access_token_encrypted, 'base64'), p_passphrase) into v_token
  from public.social_accounts
  where id = p_id;

  return v_token;
end;
$$;

create table if not exists public.social_media_posts (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid not null references public.social_accounts (id) on delete cascade,
  external_post_id text not null,
  media_type text,
  permalink text,
  thumbnail_url text,
  caption text,
  posted_at timestamptz,
  reach integer default 0,
  likes integer default 0,
  comments integer default 0,
  saved integer default 0,
  plays integer default 0,
  engagement_rate numeric(6,3) default 0,
  synced_at timestamptz not null default now(),
  unique (social_account_id, external_post_id)
);

alter table public.social_media_posts enable row level security;

-- Mismo patrón que social_accounts/social_metrics (0001): admin todo,
-- editor y cliente solo lectura. El job de sync usa la Service Role Key,
-- que en Supabase bypassea RLS por completo — no hace falta una policy
-- aparte para el cron.
drop policy if exists "social_media_posts_admin_all" on public.social_media_posts;
create policy "social_media_posts_admin_all" on public.social_media_posts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "social_media_posts_editor_select" on public.social_media_posts;
create policy "social_media_posts_editor_select" on public.social_media_posts
  for select using (
    exists (
      select 1 from public.social_accounts sa
      where sa.id = social_media_posts.social_account_id and public.editor_has_client(sa.client_id)
    )
  );

drop policy if exists "social_media_posts_member_select" on public.social_media_posts;
create policy "social_media_posts_member_select" on public.social_media_posts
  for select using (
    exists (
      select 1 from public.social_accounts sa
      where sa.id = social_media_posts.social_account_id and public.client_has_access(sa.client_id)
    )
  );

create index if not exists social_media_posts_account_posted_idx
  on public.social_media_posts (social_account_id, posted_at desc);
