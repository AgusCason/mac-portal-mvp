-- ============================================================================
-- MAC Portal — Datos de ejemplo (opcional)
-- Ejecutar DESPUÉS de 0001_schema.sql. Podés editar montos/nombres a gusto.
-- ============================================================================

insert into public.plans (name, description, price_monthly, currency, features)
values
  ('Starter', 'Ideal para creadores que arrancan', 150000, 'ARS',
    '["4 piezas de contenido/mes", "1 red social", "Soporte por chat"]'::jsonb),
  ('Growth', 'Para marcas en crecimiento activo', 350000, 'ARS',
    '["12 piezas de contenido/mes", "3 redes sociales", "Calendario editorial", "Reportes mensuales"]'::jsonb),
  ('Agencia Full', 'Gestión integral multicanal', 700000, 'ARS',
    '["Piezas ilimitadas", "Todas las redes", "Editor dedicado", "Métricas en vivo", "WhatsApp centralizado"]'::jsonb)
on conflict do nothing;
