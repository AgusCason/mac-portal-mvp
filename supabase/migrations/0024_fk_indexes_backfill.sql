-- Backfill de índices en columnas FK que quedaron sin uno al crearse la
-- tabla (relevado en el audit de performance: todo lo agregado después de
-- 0009_activity_notifications.sql que declara una FK pero no un índice
-- propio para esa columna). Sin esto, cada filtro/join por esa columna
-- (ej. "tareas asignadas a mí", "vault de este cliente") hace sequential
-- scan en vez de usar un índice — más notorio ahora que
-- 0023_editor_tasks_rls.sql agrega una policy que filtra `tasks` por
-- `assigned_to = auth.uid()` en cada request del editor.
-- `if not exists` en todas — no rompe si alguna ya existiera.

-- CRM (0012)
create index if not exists idx_crm_leads_linked_client on public.crm_leads (linked_client_id);
create index if not exists idx_crm_leads_created_by on public.crm_leads (created_by);

-- Bóveda (0013)
create index if not exists idx_vault_credentials_client on public.vault_credentials (client_id);
create index if not exists idx_vault_credentials_created_by on public.vault_credentials (created_by);

-- Alertas de métricas (0014)
create index if not exists idx_metric_alerts_account on public.metric_alerts (social_account_id);
create index if not exists idx_metric_alerts_client on public.metric_alerts (client_id);

-- Favoritos de cuenta (0015)
create index if not exists idx_client_favorites_client on public.client_favorites (client_id);

-- UTM Builder (0016)
create index if not exists idx_utm_links_client on public.utm_links (client_id);
create index if not exists idx_utm_links_created_by on public.utm_links (created_by);

-- Management (0017): tareas, proyectos, contactos, media library, knowledge base, web forms
create index if not exists idx_tasks_client on public.tasks (client_id);
create index if not exists idx_tasks_assigned_to on public.tasks (assigned_to);
create index if not exists idx_tasks_created_by on public.tasks (created_by);

create index if not exists idx_projects_client on public.projects (client_id);
create index if not exists idx_projects_created_by on public.projects (created_by);
create index if not exists idx_project_items_assigned_to on public.project_items (assigned_to);

create index if not exists idx_contacts_created_by on public.contacts (created_by);

create index if not exists idx_media_folders_created_by on public.media_folders (created_by);
create index if not exists idx_media_assets_client on public.media_assets (client_id);
create index if not exists idx_media_assets_uploaded_by on public.media_assets (uploaded_by);

create index if not exists idx_kb_articles_created_by on public.kb_articles (created_by);
create index if not exists idx_kb_article_favorites_profile on public.kb_article_favorites (profile_id);
create index if not exists idx_kb_article_favorites_article on public.kb_article_favorites (article_id);

create index if not exists idx_web_forms_created_by on public.web_forms (created_by);

-- Social Media (0018): ideas de contenido, brand voice, competidores
create index if not exists idx_content_ideas_client on public.content_ideas (client_id);
create index if not exists idx_content_ideas_created_by on public.content_ideas (created_by);
create index if not exists idx_client_brand_voice_updated_by on public.client_brand_voice (updated_by);
create index if not exists idx_competitors_created_by on public.competitors (created_by);
