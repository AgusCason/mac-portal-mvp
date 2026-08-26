-- Visibilidad de tareas para el editor — hoy `tasks` solo tiene
-- "tasks_admin_all" (0017_management.sql), así que un editor no podía ver ni
-- actualizar ni siquiera las tareas que el admin ya le asigna desde
-- /admin/tareas (`assigned_to`). Mismo patrón que
-- "assignments_editor_select" en editor_client_assignments
-- (0001_schema.sql): el editor ve/actualiza solo lo suyo, filtrado por
-- `assigned_to = auth.uid()`. El admin sigue con acceso total vía
-- "tasks_admin_all".

drop policy if exists "tasks_editor_select_own" on public.tasks;
create policy "tasks_editor_select_own" on public.tasks
  for select using (assigned_to = auth.uid());

-- Solo puede cambiar el estado de sus propias tareas (ver
-- updateMyTaskStatusAction en src/app/actions/tasks.ts, que además de esta
-- policy valida server-side que la tarea sea suya antes de tocar nada más).
drop policy if exists "tasks_editor_update_own" on public.tasks;
create policy "tasks_editor_update_own" on public.tasks
  for update using (assigned_to = auth.uid()) with check (assigned_to = auth.uid());
