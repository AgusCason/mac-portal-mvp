-- 0008_reports_storage.sql
-- Bucket privado para los PDFs de Reportes con IA (Tarea #23). A diferencia
-- de `avatars` (público, cada uno lee el suyo), acá NADIE lee directo del
-- bucket: ni siquiera el cliente dueño del reporte tiene una policy de
-- storage.objects, porque la visibilidad real depende de una regla de
-- negocio (`performance_reports.status = 'published'`) que ya vive en la
-- RLS de esa tabla. Repetirla en storage.objects sería frágil (dos lugares
-- para la misma regla). En cambio, todo acceso pasa por
-- `getReportDownloadUrlAction`: valida contra `performance_reports` (RLS
-- real) y recién ahí genera una signed URL de corta duración con la
-- Service Role Key. Por eso el bucket no tiene policies de lectura pública
-- ni por dueño — solo la Service Role (que bypassea RLS de Storage) puede
-- tocarlo.

insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;
