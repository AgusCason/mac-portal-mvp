-- Fase F2 — Panel de control del admin: on/off por módulo (visible para
-- Editor / visible para Cliente / activo en toda la plataforma). Extiende el
-- catálogo informativo de Configuración > Módulos (src/lib/modules-catalog.ts)
-- con estado real que sí gatea el sidebar (app-shell.tsx) y el acceso por URL
-- (proxy.ts). Cualquier autenticado puede leer (dato inofensivo, necesario
-- para que el propio sidebar del editor/cliente decida qué mostrarse); solo
-- el admin puede escribir.

create table if not exists public.module_flags (
  key text primary key,
  enabled boolean not null default true,
  visible_to_editor boolean not null default true,
  visible_to_client boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

alter table public.module_flags enable row level security;

drop policy if exists "module_flags_select_authenticated" on public.module_flags;
create policy "module_flags_select_authenticated" on public.module_flags
  for select using (auth.uid() is not null);

drop policy if exists "module_flags_admin_write" on public.module_flags;
create policy "module_flags_admin_write" on public.module_flags
  for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists set_updated_at on public.module_flags;
create trigger set_updated_at before update on public.module_flags
  for each row execute function public.set_updated_at();

-- Semilla: un row por cada key de MODULES_CATALOG (src/lib/modules-catalog.ts),
-- todos habilitados/visibles por defecto — el on/off es 100% opt-out.
insert into public.module_flags (key)
values
  ('calendario'), ('redes-sociales'), ('reportes-ia'), ('alertas-metricas'),
  ('cuentas'), ('equipo'), ('contratos'), ('drive'), ('chat'),
  ('planes-facturacion'), ('crm'), ('asistente-ia'),
  ('config-general'), ('config-modulos'), ('config-marca'), ('config-boveda'),
  ('actividad-notificaciones'), ('portal-clientes')
on conflict (key) do nothing;
