-- ============================================================================
-- MAC Portal — Fase 3.1 de la adaptación "estilo MB Suite": branding
-- configurable (equivalente a Configuración > Branding). Tabla singleton
-- (una sola fila, id siempre `true`) con los theme tokens que se inyectan
-- como CSS custom properties en el layout raíz — ver
-- src/lib/queries/branding.ts y src/app/layout.tsx.
--
-- Alcance real de lo que queda aplicado dinámicamente en esta fase: nombre
-- de la app, logos, favicon, color primario/acento y forma de los botones
-- (radio global). Tipografía y "relleno vs. contorno" quedan guardados en la
-- tabla para más adelante — no se aplican todavía (ver nota en la propia
-- pantalla de Configuración > Marca), para no depender de cargar fuentes
-- externas en tiempo de ejecución ni de reescribir cada botón del código.
-- ============================================================================

create table if not exists public.agency_branding (
  id boolean primary key default true,
  app_name text not null default 'MAC Portal',
  logo_light_url text,
  logo_dark_url text,
  favicon_url text,
  primary_color text not null default '#2563EB',
  accent_color text not null default '#2563EB',
  font_heading text not null default 'Inter',
  font_body text not null default 'Inter',
  button_shape text not null default 'rounded',
  button_style text not null default 'filled',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id),
  constraint agency_branding_singleton check (id),
  constraint agency_branding_button_shape check (button_shape in ('square', 'rounded', 'pill')),
  constraint agency_branding_button_style check (button_style in ('filled', 'outline'))
);

insert into public.agency_branding (id) values (true) on conflict (id) do nothing;

alter table public.agency_branding enable row level security;

-- Lectura pública (incluso sin sesión, ej. /login) — no hay nada sensible acá,
-- son solo colores/textos/URLs de imágenes.
drop policy if exists "agency_branding_select_all" on public.agency_branding;
create policy "agency_branding_select_all" on public.agency_branding
  for select using (true);

drop policy if exists "agency_branding_admin_update" on public.agency_branding;
create policy "agency_branding_admin_update" on public.agency_branding
  for update using (public.is_admin()) with check (public.is_admin());
