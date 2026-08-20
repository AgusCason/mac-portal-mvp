-- ============================================================================
-- MAC Portal — Asistente IA (Claude) dentro de la plataforma
-- Ejecutar DESPUÉS de 0001/0002/0003. Solo Admin tiene acceso (RLS abajo).
--
-- Modelo de seguridad:
--   1) RLS como piso: el asistente corre SIEMPRE con el cliente de Supabase
--      del admin que está usándolo (nunca con la Service Role Key), así que
--      nunca puede ver ni tocar más de lo que ese admin ya podría.
--   2) Minimización: las tools de lectura (ver src/lib/ai/tools.ts) devuelven
--      solo columnas necesarias — nunca tokens, claves ni secretos.
--   3) Auditoría: toda propuesta de cambio (y su resultado) queda en
--      `ai_audit_log`, visible para cualquier admin, sin importar quién la
--      generó — es un log de seguridad, no un dato privado de un cliente.
-- ============================================================================

do $$ begin
  create type ai_message_role as enum ('user', 'assistant', 'system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ai_action_status as enum ('proposed', 'confirmed', 'executed', 'rejected', 'failed');
exception when duplicate_object then null; end $$;

-- Un hilo de conversación por admin (simple: 1 admin puede tener varios hilos).
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Nueva conversación',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mensajes de cada hilo. `content` es texto plano (ya simplificado desde los
-- bloques de Anthropic) para minimizar lo que persistimos; `pending_action`
-- guarda la propuesta estructurada mientras espera confirmación humana.
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role ai_message_role not null,
  content text not null default '',
  pending_action jsonb,
  audit_log_id uuid,
  created_at timestamptz not null default now()
);

-- Registro de auditoría: toda propuesta de cambio que el asistente generó,
-- se haya confirmado, rechazado o fallado. Es la pieza central del "sin
-- sacar datos privados / mantener seguro": acá queda quién pidió qué, qué
-- se iba a cambiar exactamente (`diff`) y qué pasó.
create table if not exists public.ai_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id),
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  action_type text not null,
  target_table text,
  target_id uuid,
  summary text not null,
  diff jsonb not null default '{}'::jsonb,
  status ai_action_status not null default 'proposed',
  error text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.ai_messages
  add constraint ai_messages_audit_log_id_fkey
  foreign key (audit_log_id) references public.ai_audit_log (id) on delete set null;

create index if not exists idx_ai_messages_conversation on public.ai_messages (conversation_id, created_at);
create index if not exists idx_ai_audit_log_admin on public.ai_audit_log (admin_id, created_at desc);
create index if not exists idx_ai_conversations_admin on public.ai_conversations (admin_id, updated_at desc);

create or replace function public.set_updated_at_ai_conversations()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.ai_conversations;
create trigger set_updated_at before update on public.ai_conversations
  for each row execute function public.set_updated_at_ai_conversations();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_audit_log enable row level security;

-- Conversaciones: cada admin ve y gestiona SOLO las suyas (ni siquiera otro
-- admin puede leer el chat de un colega — el audit_log sí es compartido).
drop policy if exists "ai_conversations_owner_all" on public.ai_conversations;
create policy "ai_conversations_owner_all" on public.ai_conversations
  for all using (public.is_admin() and admin_id = auth.uid())
  with check (public.is_admin() and admin_id = auth.uid());

drop policy if exists "ai_messages_owner_all" on public.ai_messages;
create policy "ai_messages_owner_all" on public.ai_messages
  for all using (
    public.is_admin()
    and exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.admin_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    and exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.admin_id = auth.uid()
    )
  );

-- Audit log: cualquier admin puede LEER todo (supervisión cruzada de lo que
-- hizo la IA en la cuenta), pero solo el sistema (a través de las Server
-- Actions, con el admin autenticado) puede escribir sus propias filas.
drop policy if exists "ai_audit_log_admin_select" on public.ai_audit_log;
create policy "ai_audit_log_admin_select" on public.ai_audit_log
  for select using (public.is_admin());

drop policy if exists "ai_audit_log_owner_write" on public.ai_audit_log;
create policy "ai_audit_log_owner_write" on public.ai_audit_log
  for insert with check (public.is_admin() and admin_id = auth.uid());

drop policy if exists "ai_audit_log_owner_update" on public.ai_audit_log;
create policy "ai_audit_log_owner_update" on public.ai_audit_log
  for update using (public.is_admin() and admin_id = auth.uid())
  with check (public.is_admin() and admin_id = auth.uid());
