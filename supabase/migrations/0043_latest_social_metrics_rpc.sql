-- ============================================================================
-- MAC Portal — RPC para eliminar el patrón N+1 "última métrica por cuenta"
-- que se repetía en 3 lugares (getSocialAccountsOverview y
-- getClientMetricsSummary en social.ts; getAnalyticsOverview y
-- getPlatformDashboards en analytics.ts): antes se hacía 1 query aparte por
-- cada cuenta social para traer su fila más reciente de `social_metrics`,
-- lo cual escala linealmente con la cantidad de cuentas conectadas de la
-- agencia (era el motivo real de que "cambiar de sección" se sintiera cada
-- vez más lento a medida que se conectan más cuentas).
--
-- PostgREST no puede expresar "el último registro por grupo" en una sola
-- llamada REST (no soporta DISTINCT ON), así que esto se resuelve acá con
-- una función SQL: sigue siendo UNA sola consulta a Postgres sin importar
-- cuántas cuentas se pidan.
--
-- `security invoker` (no definer, default de Postgres): RLS de
-- social_metrics sigue aplicando normalmente según quién llama (admin ve
-- todo, editor solo lo de sus clientes asignados vía
-- "social_metrics_editor_select", cliente solo lo suyo vía
-- "social_metrics_member_select") — la función no eleva privilegios, solo
-- reemplaza N queries por 1.
-- ============================================================================

create or replace function public.latest_social_metrics(p_account_ids uuid[])
returns setof public.social_metrics
language sql
stable
set search_path = public
as $$
  select distinct on (social_account_id) *
  from public.social_metrics
  where social_account_id = any(p_account_ids)
  order by social_account_id, metric_date desc;
$$;

grant execute on function public.latest_social_metrics(uuid[]) to authenticated;
