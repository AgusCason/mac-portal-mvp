-- Hardening del bucket `avatars` (ver 0005_platform_v2.sql): es el ÚNICO
-- bucket público de la app con upload directo navegador -> Storage (sin
-- pasar por un Server Action que valide el archivo, porque Storage necesita
-- que el upload salga del propio browser). Hasta ahora no tenía límite de
-- tamaño ni de tipo de archivo a nivel del bucket — solo un `accept="image/*"`
-- del lado del cliente (trivial de saltear) y el `contentType` que Storage
-- guarda es el que el navegador declaró, sin validarlo contra el contenido
-- real. Eso permitía subir un archivo de cualquier tipo/tamaño a una URL
-- pública, incluyendo formatos "activos" (SVG con <script>, HTML) servidos
-- con Content-Type de imagen.
--
-- `file_size_limit` (bytes) y `allowed_mime_types` los aplica Storage del
-- lado del servidor en cada request de upload, así que esto cierra el hueco
-- sin tocar el flujo de `avatar-upload-dialog.tsx`. Se excluye a propósito
-- `image/svg+xml` (puede llevar <script> embebido).
update storage.buckets
set file_size_limit = 5242880, -- 5 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'avatars';

-- Mismo criterio para `media-library` y `reports`: son buckets privados
-- (acceso solo vía signed URL de corta duración generada por un Server
-- Action que ya valida `requireAdmin()`), así que el riesgo de servir
-- contenido activo es mucho menor — pero un límite de tamaño razonable
-- sigue siendo una buena defensa en profundidad contra abuso de storage
-- (alguien subiendo archivos gigantes repetidamente). `media-library` ya
-- valida 25MB en la propia Server Action (ver actions/media-library.ts);
-- este límite del lado del bucket es un piso extra por si ese chequeo se
-- rompe o se saltea en el futuro. Sin `allowed_mime_types acá: la
-- biblioteca de medios de la agencia recibe tipos de archivo variados a
-- propósito (PDFs, videos, zips, docs), así que no tiene sentido una
-- allowlist de MIME tipo "solo imágenes" como en avatars.
update storage.buckets
set file_size_limit = 26214400 -- 25 MB, igual al límite ya validado en la Server Action
where id = 'media-library';
