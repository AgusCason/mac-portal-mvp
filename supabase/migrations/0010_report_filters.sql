-- ============================================================================
-- MAC Portal — Fase 2.1 de la adaptación "estilo MB Suite": Reportes con IA
-- ya tenía estado draft/published (equivalente a Borrador/Finalizado de
-- Analytics > Reports en MB Suite); acá se agregan período y plataformas
-- para poder filtrar la lista igual que allá.
-- ============================================================================

alter table public.performance_reports
  add column if not exists period_label text,
  add column if not exists platforms social_platform[] not null default '{}';

comment on column public.performance_reports.period_label is
  'Etiqueta libre del período que cubre el reporte (ej. "Agosto 2026"). No se usa para calcular nada, solo para filtrar/mostrar.';
comment on column public.performance_reports.platforms is
  'Plataformas que este reporte cubre (subset de social_platform) — filtro en /admin/reportes.';
