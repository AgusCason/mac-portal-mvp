-- Fase F1 — Planner "estilo MB Suite": etiqueta de categoría de contenido
-- (Comunidad / Producto / Educativo / Promoción / Caso de éxito), visible
-- como pill de color en las 3 vistas del Planner (Tablero/Calendario/Lista).
-- Nullable: una pieza sin categoría simplemente no muestra pill.

do $$ begin
  create type content_category as enum (
    'comunidad', 'producto', 'educativo', 'promocion', 'caso_exito'
  );
exception when duplicate_object then null; end $$;

alter table public.content_items
  add column if not exists category content_category;
