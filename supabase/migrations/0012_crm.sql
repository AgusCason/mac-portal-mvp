-- ============================================================================
-- MAC Portal — Fase 3.2 de la adaptación "estilo MB Suite": CRM liviano
-- (equivalente a Comercial > CRM). Pipeline simple de prospectos comerciales
-- de la agencia — NO tiene relación con `clients` (que son cuentas ya
-- contratadas y operativas). Cuando un prospecto se gana, el admin lo da de
-- alta como Cliente normal desde /admin/clientes — `linked_client_id` queda
-- como referencia opcional para no perder la trazabilidad de qué cliente
-- salió de qué lead.
-- ============================================================================

create type public.crm_lead_stage as enum (
  'nuevo',
  'contactado',
  'calificado',
  'propuesta',
  'ganado',
  'perdido'
);

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  source text,
  estimated_value numeric,
  stage public.crm_lead_stage not null default 'nuevo',
  notes text,
  linked_client_id uuid references public.clients (id) on delete set null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_leads_stage_idx on public.crm_leads (stage);

alter table public.crm_leads enable row level security;

-- CRM es una herramienta interna de la agencia — solo admin la ve y la usa
-- (a diferencia de `clients`, acá no hay portal de cliente ni editor
-- involucrado).
drop policy if exists "crm_leads_admin_all" on public.crm_leads;
create policy "crm_leads_admin_all" on public.crm_leads
  for all using (public.is_admin()) with check (public.is_admin());
