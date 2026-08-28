-- ============================================================================
-- MAC Portal — Vínculo opcional entre una factura y un proyecto de Sitios
-- Web, para poder facturar un proyecto web (pago único / por hitos) desde su
-- propia ficha y ver ahí mismo qué se le facturó, sin crear un concepto de
-- "plan de pago único" nuevo — `billing_invoices` ya admite `plan_id` nulo,
-- así que una factura de proyecto simplemente no lleva plan y sí lleva
-- `web_project_id`.
-- ============================================================================

alter table public.billing_invoices
  add column if not exists web_project_id uuid references public.web_projects (id) on delete set null;

create index if not exists idx_billing_invoices_web_project on public.billing_invoices (web_project_id);
