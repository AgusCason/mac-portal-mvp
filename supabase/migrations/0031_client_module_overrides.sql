-- Fase F3 — Acceso por cliente: además del on/off general de
-- Configuración > Módulos (module_flags, gatea toda la plataforma), el admin
-- puede además dar o sacar acceso a un módulo del Portal de Clientes para UN
-- cliente puntual, sin tocar el interruptor general. Es una capa fina: no
-- reemplaza module_flags, lo extiende — ver mergeClientOverrides() en
-- src/lib/module-visibility.ts, usado por proxy.ts (acceso por URL) y
-- src/app/client/layout.tsx (sidebar).
--
-- Sin fila = "como agencia" (hereda module_flags.visible_to_client). Con
-- fila: `visible` manda para ESE cliente puntual — pero el kill-switch
-- general (module_flags.enabled = false) sigue ganando siempre, un cliente
-- nunca puede ver un módulo apagado para toda la plataforma.

create table if not exists public.client_module_overrides (
  client_id uuid not null references public.clients (id) on delete cascade,
  module_key text not null,
  visible boolean not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id),
  primary key (client_id, module_key)
);

alter table public.client_module_overrides enable row level security;

drop policy if exists "client_module_overrides_admin_all" on public.client_module_overrides;
create policy "client_module_overrides_admin_all" on public.client_module_overrides
  for all using (public.is_admin()) with check (public.is_admin());

-- El propio cliente necesita leer sus overrides para que su sidebar y el
-- guard de rutas (proxy.ts) sepan qué mostrarle — mismo criterio que
-- module_flags (select abierto a cualquier autenticado relacionado).
drop policy if exists "client_module_overrides_member_select" on public.client_module_overrides;
create policy "client_module_overrides_member_select" on public.client_module_overrides
  for select using (
    exists (
      select 1 from public.client_members cm
      where cm.client_id = client_module_overrides.client_id
        and cm.profile_id = auth.uid()
    )
  );

drop trigger if exists set_updated_at on public.client_module_overrides;
create trigger set_updated_at before update on public.client_module_overrides
  for each row execute function public.set_updated_at();

create index if not exists client_module_overrides_client_id_idx
  on public.client_module_overrides (client_id);
