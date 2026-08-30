-- ============================================================================
-- Actualiza el color de marca por defecto al lima real de la agencia
-- (#B4FF4A), reemplazando el azul placeholder con el que se creó la tabla
-- en 0011_branding.sql. Cambia el default de la columna (para instalaciones
-- nuevas) y además la fila existente, pero solo si sigue en el valor
-- original — así no pisa un color que el admin ya haya personalizado a mano
-- desde Configuración > Marca.
-- ============================================================================

alter table public.agency_branding
  alter column primary_color set default '#B4FF4A',
  alter column accent_color set default '#B4FF4A';

update public.agency_branding
set primary_color = '#B4FF4A', accent_color = '#B4FF4A'
where id = true and primary_color = '#2563EB' and accent_color = '#2563EB';
