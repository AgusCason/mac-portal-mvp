-- Backfill de module_flags para los 12 ítems de navegación que no tenían
-- entrada en MODULES_CATALOG / ROUTE_MODULE_MAP (relevado en el mapa del
-- Admin): sin esto, Configuración > Módulos no podía prender/apagar estas
-- pantallas porque `findModuleKeyForPath` no encontraba ninguna key.
-- Mismo patrón que la semilla de 0021_module_flags.sql: todos
-- habilitados/visibles por defecto, on/off 100% opt-out.

insert into public.module_flags (key)
values
  ('redes-insights'),
  ('analytics-overview'), ('analytics-dashboards'), ('analytics-explorer'),
  ('analytics-envios'), ('analytics-utm-builder'),
  ('tareas'), ('proyectos'), ('contactos'),
  ('media-library'), ('knowledge-base'), ('web-forms')
on conflict (key) do nothing;
