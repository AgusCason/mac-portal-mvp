/**
 * Tipos manuales alineados a supabase/migrations/*.sql.
 * Si preferís tipos 100% generados, corré:
 *   npx supabase gen types typescript --project-id <tu-project-id> > src/types/database.ts
 * (requiere Supabase CLI y estar logueado: ver README.md)
 */

export type UserRole = "admin" | "editor" | "client";
export type ClientStatus = "active" | "paused" | "churned";
export type DriveFolderType = "crudos" | "en_edicion" | "entregables_finales";
export type ContentNetwork =
  | "instagram_reel"
  | "instagram_feed"
  | "instagram_story"
  | "tiktok"
  | "youtube_short"
  | "youtube_long";
export type ContentStatus =
  | "borrador"
  | "en_edicion"
  | "por_aprobar"
  | "requiere_cambios"
  | "aprobado"
  | "programado"
  | "publicado";
export type ContentCategory =
  | "comunidad"
  | "producto"
  | "educativo"
  | "promocion"
  | "caso_exito";
export type ContractStatus = "pendiente" | "firmado";
export type MessageDirection = "inbound" | "outbound";
export type SocialPlatform = "instagram" | "tiktok" | "youtube";
export type PlanStatus = "active" | "paused" | "ended";
export type AiMessageRole = "user" | "assistant" | "system";
export type AiActionStatus = "proposed" | "confirmed" | "executed" | "rejected" | "failed";
export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";
export type PaymentMethod =
  | "mercadopago"
  | "paypal"
  | "transferencia"
  | "payoneer"
  | "crypto"
  | "otro";
/**
 * Kind de `payment_methods` (config de cobro de la agencia, Configuración >
 * Planes y facturación > Métodos de cobro) — independiente de `PaymentMethod`
 * de arriba (que es el método elegido factura por factura). Transferencia se
 * separa en ARS/USD porque los datos que hay que mostrarle al cliente son
 * distintos (CBU/alias vs. cuenta + routing/SWIFT).
 */
export type PaymentMethodKind =
  | "paypal"
  | "mercadopago"
  | "payoneer"
  | "transferencia_ars"
  | "transferencia_usd";
export type ReportStatus = "draft" | "published";
export type CrmLeadStage =
  | "nuevo"
  | "contactado"
  | "calificado"
  | "propuesta"
  | "ganado"
  | "perdido";
export type TaskStatus = "pendiente" | "en_curso" | "completada" | "cancelada";
export type TaskPriority = "baja" | "media" | "alta" | "urgente";
export type ProjectStatus = "por_iniciar" | "en_curso" | "en_pausa" | "completado" | "cancelado";
export type WebProjectStage =
  | "brief"
  | "diseno"
  | "desarrollo"
  | "qa"
  | "lanzamiento"
  | "mantenimiento"
  | "pausado"
  | "cancelado";
export type WebAssetStatus = "pendiente" | "aprobado" | "requiere_cambios";

/** Frecuencia de pago acordada por editor+cliente (ver EditorClientAssignment.pay_*). */
export type EditorPayFrequency = "mensual" | "quincenal" | "unico" | "por_entrega";
/** Frecuencia de costo de una herramienta de la agencia (ver AgencyTool.cost_*). */
export type ToolCostFrequency = "mensual" | "anual" | "unico";
/** Estado de una fila del historial de pagos de un editor (editor_payouts). */
export type EditorPayoutStatus = "pendiente" | "pagado";
export type EditorPayoutMethod =
  | "transferencia"
  | "mercadopago"
  | "paypal"
  | "payoneer"
  | "efectivo"
  | "crypto"
  | "otro";

export type ProfileTheme = "midnight_dark" | "modern_mix" | "pure_light" | "psychedelic";
export type ProfileLanguage = "es" | "en" | "pt";
export type ProfileNumberFormat = "es_latam" | "en_us";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  job_title: string;
  phone: string;
  location: string;
  bio: string;
  language: ProfileLanguage;
  number_format: ProfileNumberFormat;
  theme_preference: ProfileTheme;
  notify_marketing: boolean;
  notify_product_updates: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  brand_name: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: ClientStatus;
  drive_root_folder_id: string | null;
  created_by: string | null;
  country: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  social_facebook: string | null;
  social_youtube: string | null;
  social_website: string | null;
  billing_cutoff_day: number | null;
  created_at: string;
  updated_at: string;
}

export interface ClientMember {
  client_id: string;
  profile_id: string;
  created_at: string;
}

/** Favorito de Cuenta por admin — ver 0015_account_favorites.sql. */
export interface ClientFavorite {
  profile_id: string;
  client_id: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  currency: string;
  features: string[];
  monthly_quota: number | null;
  created_at: string;
}

export interface ClientPlan {
  id: string;
  client_id: string;
  plan_id: string;
  price_override: number | null;
  status: PlanStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface EditorClientAssignment {
  id: string;
  editor_id: string;
  client_id: string;
  can_view_chat: boolean;
  can_view_drive: boolean;
  assigned_by: string | null;
  created_at: string;
  /** Monto acordado con este editor por este cliente — null = todavía sin definir. */
  pay_amount: number | null;
  pay_currency: string;
  pay_frequency: EditorPayFrequency | null;
  /** Día del mes (1-31) en que se espera el pago, si la frecuencia lo amerita. */
  pay_day: number | null;
  pay_notes: string | null;
}

/**
 * Historial de pagos concretos a un editor (Finanzas de Equipo) — el admin
 * carga cada fila a mano, tanto pagos ya hechos como pendientes con su fecha
 * esperada (ver comentario de 0040_editor_finance_and_tools.sql).
 */
export interface EditorPayout {
  id: string;
  editor_id: string;
  client_id: string | null;
  amount: number;
  currency: string;
  method: EditorPayoutMethod | null;
  status: EditorPayoutStatus;
  period_label: string | null;
  due_date: string;
  paid_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Herramienta/app de la agencia (Herramientas) — nombre, para qué es, link y
 * accesos. `account_password_encrypted` nunca sale de una consulta normal:
 * solo se descifra bajo demanda vía `agency_tool_reveal_password` (admin, o
 * un editor al que se la compartieron — ver `AgencyToolAccess`).
 */
export interface AgencyTool {
  id: string;
  name: string;
  purpose: string | null;
  url: string | null;
  account_email: string | null;
  notes: string | null;
  /** Cuánto sale esta herramienta — null = costo no cargado (ej. plan gratuito). */
  cost_amount: number | null;
  cost_currency: string;
  cost_frequency: ToolCostFrequency | null;
  /** Próxima fecha de renovación/vencimiento — la carga el admin a mano, no se auto-genera. */
  next_renewal_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Fila de "a quién se le compartió" una herramienta puntual. */
export interface AgencyToolAccess {
  id: string;
  tool_id: string;
  editor_id: string;
  granted_by: string | null;
  granted_at: string;
}

export interface DriveFolder {
  id: string;
  client_id: string;
  folder_type: DriveFolderType;
  drive_folder_id: string;
  created_at: string;
}

export interface ContentItem {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  network: ContentNetwork;
  status: ContentStatus;
  category: ContentCategory | null;
  scheduled_at: string | null;
  drive_file_id: string | null;
  thumbnail_url: string | null;
  assigned_editor_id: string | null;
  created_by: string | null;
  publish_reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentComment {
  id: string;
  content_item_id: string;
  author_id: string;
  body: string;
  timestamp_seconds: number | null;
  created_at: string;
}

export interface Contract {
  id: string;
  client_id: string;
  title: string;
  file_url: string;
  status: ContractStatus;
  signed_at: string | null;
  signed_ip: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  client_id: string;
  sender_profile_id: string | null;
  direction: MessageDirection;
  body: string;
  whatsapp_message_id: string | null;
  created_at: string;
}

export interface SocialAccount {
  id: string;
  client_id: string;
  platform: SocialPlatform;
  external_account_id: string;
  display_name: string | null;
  // Nunca se lee/escribe en texto plano — solo vía las funciones SQL
  // `social_account_store_token` / `social_account_reveal_token`
  // (pgcrypto, ver supabase/migrations/0038_social_account_tokens.sql).
  access_token_encrypted: string | null;
  connected_by: string | null;
  connected_at: string;
}

export interface SocialMetric {
  id: string;
  social_account_id: string;
  metric_date: string;
  reach: number;
  impressions: number;
  engagement_rate: number;
  followers: number;
  plays: number;
}

/**
 * Una publicación real de Instagram con sus métricas — resultado de leer la
 * Graph API (ver `netlify/functions/sync-social-metrics.ts`), no confundir
 * con `ContentItem` (la grilla de contenido PLANEADO/por publicar).
 */
export interface SocialMediaPost {
  id: string;
  social_account_id: string;
  external_post_id: string;
  media_type: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  posted_at: string | null;
  reach: number;
  likes: number;
  comments: number;
  saved: number;
  plays: number;
  engagement_rate: number;
  synced_at: string;
}

export interface BillingInvoice {
  id: string;
  client_id: string;
  plan_id: string | null;
  /** Proyecto de Sitios Web al que corresponde esta factura, si es una factura de proyecto (no de plan). */
  web_project_id: string | null;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: InvoiceStatus;
  due_date: string;
  paid_at: string | null;
  marked_paid_by: string | null;
  notes: string | null;
  delinquency_alert_sent_at: string | null;
  created_at: string;
}

export interface PerformanceReport {
  id: string;
  client_id: string;
  title: string;
  summary: string;
  pdf_path: string | null;
  status: ReportStatus;
  generated_by: string | null;
  period_label: string | null;
  platforms: SocialPlatform[];
  created_at: string;
  published_at: string | null;
}

export interface CrmLead {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  source: string | null;
  estimated_value: number | null;
  stage: CrmLeadStage;
  notes: string | null;
  linked_client_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Management (Fase "Management" de la adaptación estilo MB Suite) — ver
// supabase/migrations/0017_management.sql.
// ---------------------------------------------------------------------------

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  client_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  client_id: string | null;
  status: ProjectStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectItem {
  id: string;
  project_id: string;
  title: string;
  status: ProjectStatus;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Proyecto de diseño y desarrollo web de un cliente — ver 0028_web_projects.sql. */
export interface WebProject {
  id: string;
  client_id: string;
  title: string;
  description: string;
  stage: WebProjectStage;
  domain: string | null;
  staging_url: string | null;
  production_url: string | null;
  hosting_provider: string | null;
  tech_stack: string | null;
  launch_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Entregable (mockup, link de staging, etc.) de un WebProject, aprobable por el cliente. */
export interface WebProjectAsset {
  id: string;
  web_project_id: string;
  title: string;
  file_url: string;
  status: WebAssetStatus;
  client_note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  client_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  color: string;
  created_by: string | null;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  folder_id: string | null;
  client_id: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface KbArticle {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  views_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface KbArticleFavorite {
  profile_id: string;
  article_id: string;
  created_at: string;
}

export interface WebForm {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export type ContentIdeaType = "serie_social" | "sesion_fotos" | "video_script" | "caption" | "content_bank";

/** Social Media > Content Studio — banco de ideas/guiones de contenido. */
export interface ContentIdea {
  id: string;
  type: ContentIdeaType;
  client_id: string | null;
  title: string;
  body: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Social Media > Brand Voice — ficha de tono de marca, una por cuenta. */
export interface ClientBrandVoice {
  client_id: string;
  tone_personality: string;
  vocabulary: string;
  emoji_rules: string;
  target_audience: string;
  platform_settings: string;
  updated_by: string | null;
  updated_at: string;
}

/** Social Media > Competidores — perfiles de la competencia por cuenta. */
export interface Competitor {
  id: string;
  client_id: string | null;
  name: string;
  platform: SocialPlatform;
  handle: string;
  followers_count: number | null;
  engagement_rate: number | null;
  notes: string;
  created_by: string | null;
  created_at: string;
}

/** Un link con parámetros UTM generado desde Analytics > UTM Builder. */
export interface UtmLink {
  id: string;
  client_id: string | null;
  created_by: string | null;
  base_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string | null;
  utm_content: string | null;
  generated_url: string;
  created_at: string;
}

/** Fila de la bóveda TAL COMO se lee del cliente: nunca incluye el secreto en
 * texto plano (`secret_encrypted` es un bytea cifrado, se omite en el SELECT
 * de listado) — el valor real solo sale vía `vault_reveal_credential`. */
export interface VaultCredential {
  id: string;
  client_id: string | null;
  label: string;
  username: string | null;
  url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetricAlert {
  id: string;
  social_account_id: string;
  client_id: string;
  metric_date: string;
  metric_type: string;
  previous_avg: number;
  current_value: number;
  drop_pct: number;
  created_at: string;
}

export type ButtonShape = "square" | "rounded" | "pill";
export type ButtonStyle = "filled" | "outline";

export interface AgencyBranding {
  id: boolean;
  app_name: string;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  button_shape: ButtonShape;
  button_style: ButtonStyle;
  updated_at: string;
  updated_by: string | null;
}

export interface ModuleFlag {
  key: string;
  enabled: boolean;
  visible_to_editor: boolean;
  visible_to_client: boolean;
  updated_at: string;
  updated_by: string | null;
}

/** Override de acceso a un módulo del Portal de Clientes para UN cliente
 *  puntual — ver 0031_client_module_overrides.sql y module-visibility.ts. */
export interface ClientModuleOverride {
  client_id: string;
  module_key: string;
  visible: boolean;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Una fila por método de cobro (siempre las 5 de `PaymentMethodKind`, sembradas
 * por la migración) — agency-wide, no por cliente. Nivel 1 (link generado a
 * mano en el dashboard de PayPal/Mercado Pago/Payoneer + transferencia con
 * datos fijos de la agencia); las columnas `api_*_encrypted` quedan listas
 * para un Nivel 2 futuro (checkout dinámico vía API + webhook) sin tener que
 * migrar de nuevo.
 */
export interface PaymentMethodConfig {
  kind: PaymentMethodKind;
  enabled: boolean;
  payment_link: string | null;
  account_holder: string | null;
  cuit: string | null;
  cbu: string | null;
  alias: string | null;
  bank_name: string | null;
  bank_address: string | null;
  account_number: string | null;
  routing_number: string | null;
  swift_bic: string | null;
  api_key_encrypted: string | null;
  api_secret_encrypted: string | null;
  notes: string | null;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Registro de auditoría de acciones financieras/sensibles (Configuración >
 * Auditoría) — solo admin (RLS), nunca visible para editor/cliente. Se
 * llena solo, vía triggers y las funciones de la Bóveda (0026_audit_log.sql)
 * — nada en la app inserta acá directamente.
 */
export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action_type: string;
  target_table: string;
  target_id: string | null;
  client_id: string | null;
  summary: string;
  diff: Record<string, unknown>;
  created_at: string;
}

/**
 * Bloqueo automático temporal (0027_security_hardening.sql) — creado por
 * `check_rate_limit()` cuando una key (IP, email+IP, teléfono, etc.) supera
 * el máximo de intentos. Se destraba solo al pasar `blocked_until`; nada en
 * la app inserta acá directamente, solo la función SQL.
 */
export interface SecurityBlock {
  id: string;
  block_key: string;
  reason: string;
  blocked_until: string;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  client_id: string | null;
  actor_id: string | null;
  event_type: string;
  summary: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  profile_id: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface AiConversation {
  id: string;
  admin_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: AiMessageRole;
  content: string;
  pending_action: AiProposedAction | null;
  audit_log_id: string | null;
  created_at: string;
}

export interface AiAuditLog {
  id: string;
  admin_id: string;
  conversation_id: string | null;
  action_type: string;
  target_table: string | null;
  target_id: string | null;
  summary: string;
  diff: Record<string, unknown>;
  status: AiActionStatus;
  error: string | null;
  created_at: string;
  resolved_at: string | null;
}

/** Forma de una propuesta de cambio generada por el asistente (tool `propose_change`). */
export interface AiProposedAction {
  action_type: string;
  target_table: string;
  target_id: string;
  summary: string;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Definición del cliente tipado de Supabase (Row/Insert/Update/Relationships
// por tabla + Functions para las RPC security-definer). Ver postgrest-js
// GenericSchema — Relationships solo necesita listar los FKs que realmente
// usamos en `.select("*, tabla(...)")` a lo largo del código.
// ---------------------------------------------------------------------------

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
// Los `interface` (Profile, Client, ...) no traen un index signature implícito,
// así que TS los rechaza en los checks `extends Record<string, unknown>` que usa
// postgrest-js internamente. `Flatten` los "aplana" a un object type literal
// (mapped type) que sí cumple esa condición — sin esto, TODA la tabla cae a
// `never` en silencio y cada `.insert()/.update()/.select()` deja de tipar.
type Flatten<T> = { [K in keyof T]: T[K] };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Flatten<Profile>;
        Insert: Flatten<
          Optional<
            Profile,
            | "full_name"
            | "role"
            | "avatar_url"
            | "job_title"
            | "phone"
            | "location"
            | "bio"
            | "language"
            | "number_format"
            | "theme_preference"
            | "notify_marketing"
            | "notify_product_updates"
            | "created_at"
          >
        >;
        Update: Flatten<Partial<Profile>>;
        Relationships: [];
      };
      clients: {
        Row: Flatten<Client>;
        Insert: Flatten<
          Optional<
            Client,
            | "id"
            | "brand_name"
            | "logo_url"
            | "contact_email"
            | "contact_phone"
            | "status"
            | "drive_root_folder_id"
            | "created_by"
            | "country"
            | "social_instagram"
            | "social_tiktok"
            | "social_facebook"
            | "social_youtube"
            | "social_website"
            | "billing_cutoff_day"
            | "created_at"
            | "updated_at"
          >
        >;
        Update: Flatten<Partial<Client>>;
        Relationships: [];
      };
      client_members: {
        Row: Flatten<ClientMember>;
        Insert: Flatten<Optional<ClientMember, "created_at">>;
        Update: Flatten<Partial<ClientMember>>;
        Relationships: [];
      };
      client_favorites: {
        Row: Flatten<ClientFavorite>;
        Insert: Flatten<Optional<ClientFavorite, "created_at">>;
        Update: Flatten<Partial<ClientFavorite>>;
        Relationships: [];
      };
      plans: {
        Row: Flatten<Plan>;
        Insert: Flatten<
          Optional<
            Plan,
            "id" | "description" | "currency" | "features" | "monthly_quota" | "created_at"
          >
        >;
        Update: Flatten<Partial<Plan>>;
        Relationships: [];
      };
      client_plans: {
        Row: Flatten<ClientPlan>;
        Insert: Flatten<
          Optional<
            ClientPlan,
            "id" | "price_override" | "status" | "start_date" | "end_date" | "created_at"
          >
        >;
        Update: Flatten<Partial<ClientPlan>>;
        Relationships: [
          {
            foreignKeyName: "client_plans_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      editor_client_assignments: {
        Row: Flatten<EditorClientAssignment>;
        Insert: Flatten<
          Optional<
            EditorClientAssignment,
            | "id"
            | "can_view_chat"
            | "can_view_drive"
            | "assigned_by"
            | "created_at"
            | "pay_amount"
            | "pay_currency"
            | "pay_frequency"
            | "pay_day"
            | "pay_notes"
          >
        >;
        Update: Flatten<Partial<EditorClientAssignment>>;
        Relationships: [
          {
            foreignKeyName: "editor_client_assignments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "editor_client_assignments_editor_id_fkey";
            columns: ["editor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      drive_folders: {
        Row: Flatten<DriveFolder>;
        Insert: Flatten<Optional<DriveFolder, "id" | "created_at">>;
        Update: Flatten<Partial<DriveFolder>>;
        Relationships: [];
      };
      content_items: {
        Row: Flatten<ContentItem>;
        Insert: Flatten<
          Optional<
            ContentItem,
            | "id"
            | "description"
            | "status"
            | "scheduled_at"
            | "drive_file_id"
            | "thumbnail_url"
            | "assigned_editor_id"
            | "created_by"
            | "publish_reminder_sent_at"
            | "created_at"
            | "updated_at"
          >
        >;
        Update: Flatten<Partial<ContentItem>>;
        Relationships: [
          {
            foreignKeyName: "content_items_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      content_comments: {
        Row: Flatten<ContentComment>;
        Insert: Flatten<Optional<ContentComment, "id" | "timestamp_seconds" | "created_at">>;
        Update: Flatten<Partial<ContentComment>>;
        Relationships: [];
      };
      contracts: {
        Row: Flatten<Contract>;
        Insert: Flatten<
          Optional<Contract, "id" | "status" | "signed_at" | "signed_ip" | "created_at">
        >;
        Update: Flatten<Partial<Contract>>;
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_invoices: {
        Row: Flatten<BillingInvoice>;
        Insert: Flatten<
          Optional<
            BillingInvoice,
            | "id"
            | "plan_id"
            | "web_project_id"
            | "currency"
            | "method"
            | "status"
            | "paid_at"
            | "marked_paid_by"
            | "notes"
            | "delinquency_alert_sent_at"
            | "created_at"
          >
        >;
        Update: Flatten<Partial<BillingInvoice>>;
        Relationships: [
          {
            foreignKeyName: "billing_invoices_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_invoices_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_invoices_web_project_id_fkey";
            columns: ["web_project_id"];
            isOneToOne: false;
            referencedRelation: "web_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      performance_reports: {
        Row: Flatten<PerformanceReport>;
        Insert: Flatten<
          Optional<
            PerformanceReport,
            | "id"
            | "summary"
            | "pdf_path"
            | "status"
            | "generated_by"
            | "period_label"
            | "platforms"
            | "created_at"
            | "published_at"
          >
        >;
        Update: Flatten<Partial<PerformanceReport>>;
        Relationships: [
          {
            foreignKeyName: "performance_reports_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_messages: {
        Row: Flatten<ChatMessage>;
        Insert: Flatten<
          Optional<ChatMessage, "id" | "sender_profile_id" | "whatsapp_message_id" | "created_at">
        >;
        Update: Flatten<Partial<ChatMessage>>;
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_profile_id_fkey";
            columns: ["sender_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      social_accounts: {
        Row: Flatten<SocialAccount>;
        Insert: Flatten<
          Optional<
            SocialAccount,
            "id" | "display_name" | "access_token_encrypted" | "connected_by" | "connected_at"
          >
        >;
        Update: Flatten<Partial<SocialAccount>>;
        Relationships: [
          {
            foreignKeyName: "social_accounts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      social_metrics: {
        Row: Flatten<SocialMetric>;
        Insert: Flatten<
          Optional<
            SocialMetric,
            "id" | "reach" | "impressions" | "engagement_rate" | "followers" | "plays"
          >
        >;
        Update: Flatten<Partial<SocialMetric>>;
        Relationships: [];
      };
      social_media_posts: {
        Row: Flatten<SocialMediaPost>;
        Insert: Flatten<
          Optional<
            SocialMediaPost,
            | "id"
            | "media_type"
            | "permalink"
            | "thumbnail_url"
            | "caption"
            | "posted_at"
            | "reach"
            | "likes"
            | "comments"
            | "saved"
            | "plays"
            | "engagement_rate"
            | "synced_at"
          >
        >;
        Update: Flatten<Partial<SocialMediaPost>>;
        Relationships: [];
      };
      ai_conversations: {
        Row: Flatten<AiConversation>;
        Insert: Flatten<Optional<AiConversation, "id" | "title" | "created_at" | "updated_at">>;
        Update: Flatten<Partial<AiConversation>>;
        Relationships: [];
      };
      ai_messages: {
        Row: Flatten<AiMessage>;
        Insert: Flatten<
          Optional<AiMessage, "id" | "content" | "pending_action" | "audit_log_id" | "created_at">
        >;
        Update: Flatten<Partial<AiMessage>>;
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      agency_branding: {
        Row: Flatten<AgencyBranding>;
        Insert: Flatten<
          Optional<
            AgencyBranding,
            | "app_name"
            | "logo_light_url"
            | "logo_dark_url"
            | "favicon_url"
            | "primary_color"
            | "accent_color"
            | "font_heading"
            | "font_body"
            | "button_shape"
            | "button_style"
            | "updated_at"
            | "updated_by"
          >
        >;
        Update: Flatten<Partial<AgencyBranding>>;
        Relationships: [];
      };
      module_flags: {
        Row: Flatten<ModuleFlag>;
        Insert: Flatten<
          Optional<
            ModuleFlag,
            "enabled" | "visible_to_editor" | "visible_to_client" | "updated_at" | "updated_by"
          >
        >;
        Update: Flatten<Partial<ModuleFlag>>;
        Relationships: [];
      };
      client_module_overrides: {
        Row: Flatten<ClientModuleOverride>;
        Insert: Flatten<Optional<ClientModuleOverride, "updated_at" | "updated_by">>;
        Update: Flatten<Partial<ClientModuleOverride>>;
        Relationships: [];
      };
      payment_methods: {
        Row: Flatten<PaymentMethodConfig>;
        Insert: Flatten<
          Optional<
            PaymentMethodConfig,
            | "enabled"
            | "payment_link"
            | "account_holder"
            | "cuit"
            | "cbu"
            | "alias"
            | "bank_name"
            | "bank_address"
            | "account_number"
            | "routing_number"
            | "swift_bic"
            | "api_key_encrypted"
            | "api_secret_encrypted"
            | "notes"
            | "updated_at"
            | "updated_by"
          >
        >;
        Update: Flatten<Partial<PaymentMethodConfig>>;
        Relationships: [];
      };
      audit_log: {
        Row: Flatten<AuditLogEntry>;
        Insert: Flatten<
          Optional<AuditLogEntry, "id" | "actor_id" | "target_id" | "client_id" | "diff" | "created_at">
        >;
        Update: Flatten<Partial<AuditLogEntry>>;
        Relationships: [];
      };
      security_blocks: {
        Row: Flatten<SecurityBlock>;
        Insert: Flatten<Optional<SecurityBlock, "id" | "created_at">>;
        Update: Flatten<Partial<SecurityBlock>>;
        Relationships: [];
      };
      activity_events: {
        Row: Flatten<ActivityEvent>;
        Insert: Flatten<Optional<ActivityEvent, "id" | "client_id" | "actor_id" | "created_at">>;
        Update: Flatten<Partial<ActivityEvent>>;
        Relationships: [
          {
            foreignKeyName: "activity_events_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: Flatten<AppNotification>;
        Insert: Flatten<
          Optional<AppNotification, "id" | "body" | "link" | "read_at" | "created_at">
        >;
        Update: Flatten<Partial<AppNotification>>;
        Relationships: [];
      };
      crm_leads: {
        Row: Flatten<CrmLead>;
        Insert: Flatten<
          Optional<
            CrmLead,
            | "id"
            | "contact_name"
            | "contact_email"
            | "contact_phone"
            | "source"
            | "estimated_value"
            | "stage"
            | "notes"
            | "linked_client_id"
            | "created_by"
            | "created_at"
            | "updated_at"
          >
        >;
        Update: Flatten<Partial<CrmLead>>;
        Relationships: [];
      };
      utm_links: {
        Row: Flatten<UtmLink>;
        Insert: Flatten<
          Optional<UtmLink, "id" | "client_id" | "created_by" | "utm_term" | "utm_content" | "created_at">
        >;
        Update: Flatten<Partial<UtmLink>>;
        Relationships: [
          {
            foreignKeyName: "utm_links_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: Flatten<Task>;
        Insert: Flatten<
          Optional<
            Task,
            | "id"
            | "description"
            | "status"
            | "priority"
            | "due_date"
            | "client_id"
            | "assigned_to"
            | "created_by"
            | "created_at"
            | "updated_at"
          >
        >;
        Update: Flatten<Partial<Task>>;
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: Flatten<Project>;
        Insert: Flatten<
          Optional<Project, "id" | "description" | "client_id" | "status" | "created_by" | "created_at" | "updated_at">
        >;
        Update: Flatten<Partial<Project>>;
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      project_items: {
        Row: Flatten<ProjectItem>;
        Insert: Flatten<
          Optional<ProjectItem, "id" | "status" | "assigned_to" | "due_date" | "created_at" | "updated_at">
        >;
        Update: Flatten<Partial<ProjectItem>>;
        Relationships: [
          {
            foreignKeyName: "project_items_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      web_projects: {
        Row: Flatten<WebProject>;
        Insert: Flatten<
          Optional<
            WebProject,
            | "id"
            | "description"
            | "stage"
            | "domain"
            | "staging_url"
            | "production_url"
            | "hosting_provider"
            | "tech_stack"
            | "launch_date"
            | "created_by"
            | "created_at"
            | "updated_at"
          >
        >;
        Update: Flatten<Partial<WebProject>>;
        Relationships: [
          {
            foreignKeyName: "web_projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      web_project_assets: {
        Row: Flatten<WebProjectAsset>;
        Insert: Flatten<
          Optional<WebProjectAsset, "id" | "status" | "client_note" | "created_by" | "created_at" | "updated_at">
        >;
        Update: Flatten<Partial<WebProjectAsset>>;
        Relationships: [
          {
            foreignKeyName: "web_project_assets_web_project_id_fkey";
            columns: ["web_project_id"];
            isOneToOne: false;
            referencedRelation: "web_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: Flatten<Contact>;
        Insert: Flatten<
          Optional<
            Contact,
            | "id"
            | "role_title"
            | "email"
            | "phone"
            | "tags"
            | "client_id"
            | "notes"
            | "created_by"
            | "created_at"
            | "updated_at"
          >
        >;
        Update: Flatten<Partial<Contact>>;
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      media_folders: {
        Row: Flatten<MediaFolder>;
        Insert: Flatten<Optional<MediaFolder, "id" | "color" | "created_by" | "created_at">>;
        Update: Flatten<Partial<MediaFolder>>;
        Relationships: [];
      };
      media_assets: {
        Row: Flatten<MediaAsset>;
        Insert: Flatten<
          Optional<MediaAsset, "id" | "folder_id" | "client_id" | "size_bytes" | "uploaded_by" | "created_at">
        >;
        Update: Flatten<Partial<MediaAsset>>;
        Relationships: [
          {
            foreignKeyName: "media_assets_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "media_folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_assets_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      kb_articles: {
        Row: Flatten<KbArticle>;
        Insert: Flatten<
          Optional<KbArticle, "id" | "body" | "is_pinned" | "views_count" | "created_by" | "created_at" | "updated_at">
        >;
        Update: Flatten<Partial<KbArticle>>;
        Relationships: [];
      };
      kb_article_favorites: {
        Row: Flatten<KbArticleFavorite>;
        Insert: Flatten<Optional<KbArticleFavorite, "created_at">>;
        Update: Flatten<Partial<KbArticleFavorite>>;
        Relationships: [];
      };
      web_forms: {
        Row: Flatten<WebForm>;
        Insert: Flatten<Optional<WebForm, "id" | "description" | "is_active" | "created_by" | "created_at">>;
        Update: Flatten<Partial<WebForm>>;
        Relationships: [];
      };
      form_submissions: {
        Row: Flatten<FormSubmission>;
        Insert: Flatten<Optional<FormSubmission, "id" | "message" | "created_at">>;
        Update: Flatten<Partial<FormSubmission>>;
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey";
            columns: ["form_id"];
            isOneToOne: false;
            referencedRelation: "web_forms";
            referencedColumns: ["id"];
          },
        ];
      };
      content_ideas: {
        Row: Flatten<ContentIdea>;
        Insert: Flatten<Optional<ContentIdea, "id" | "body" | "client_id" | "created_by" | "created_at" | "updated_at">>;
        Update: Flatten<Partial<ContentIdea>>;
        Relationships: [
          {
            foreignKeyName: "content_ideas_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      client_brand_voice: {
        Row: Flatten<ClientBrandVoice>;
        Insert: Flatten<
          Optional<
            ClientBrandVoice,
            "tone_personality" | "vocabulary" | "emoji_rules" | "target_audience" | "platform_settings" | "updated_by" | "updated_at"
          >
        >;
        Update: Flatten<Partial<ClientBrandVoice>>;
        Relationships: [
          {
            foreignKeyName: "client_brand_voice_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: true;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      competitors: {
        Row: Flatten<Competitor>;
        Insert: Flatten<
          Optional<Competitor, "id" | "client_id" | "followers_count" | "engagement_rate" | "notes" | "created_by" | "created_at">
        >;
        Update: Flatten<Partial<Competitor>>;
        Relationships: [
          {
            foreignKeyName: "competitors_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      vault_credentials: {
        Row: Flatten<VaultCredential & { secret_encrypted: string }>;
        // El insert/update reales pasan por las funciones vault_add_credential /
        // vault_update_credential (necesitan cifrar) — esto solo tipa la tabla
        // para el SELECT de listado y el DELETE directo.
        Insert: Flatten<
          Optional<
            VaultCredential & { secret_encrypted: string },
            | "id"
            | "client_id"
            | "username"
            | "url"
            | "notes"
            | "created_by"
            | "created_at"
            | "updated_at"
          >
        >;
        Update: Flatten<Partial<VaultCredential & { secret_encrypted: string }>>;
        Relationships: [
          {
            foreignKeyName: "vault_credentials_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      metric_alerts: {
        Row: Flatten<MetricAlert>;
        Insert: Flatten<Optional<MetricAlert, "id" | "created_at">>;
        Update: Flatten<Partial<MetricAlert>>;
        Relationships: [
          {
            foreignKeyName: "metric_alerts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metric_alerts_social_account_id_fkey";
            columns: ["social_account_id"];
            isOneToOne: false;
            referencedRelation: "social_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_audit_log: {
        Row: Flatten<AiAuditLog>;
        Insert: Flatten<
          Optional<
            AiAuditLog,
            | "id"
            | "conversation_id"
            | "target_table"
            | "target_id"
            | "diff"
            | "status"
            | "error"
            | "created_at"
            | "resolved_at"
          >
        >;
        Update: Flatten<Partial<AiAuditLog>>;
        Relationships: [];
      };
      editor_payouts: {
        Row: Flatten<EditorPayout>;
        Insert: Flatten<
          Optional<
            EditorPayout,
            | "id"
            | "client_id"
            | "method"
            | "status"
            | "period_label"
            | "paid_at"
            | "notes"
            | "created_by"
            | "created_at"
            | "updated_at"
          >
        >;
        Update: Flatten<Partial<EditorPayout>>;
        Relationships: [
          {
            foreignKeyName: "editor_payouts_editor_id_fkey";
            columns: ["editor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "editor_payouts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      agency_tools: {
        Row: Flatten<AgencyTool & { account_password_encrypted: string | null }>;
        // El insert/update reales pasan por agency_tool_create/agency_tool_update
        // (necesitan cifrar la contraseña) — esto solo tipa el SELECT de listado
        // y el DELETE directo.
        Insert: Flatten<
          Optional<
            AgencyTool & { account_password_encrypted: string | null },
            | "id"
            | "purpose"
            | "url"
            | "account_email"
            | "account_password_encrypted"
            | "notes"
            | "cost_amount"
            | "cost_currency"
            | "cost_frequency"
            | "next_renewal_date"
            | "created_by"
            | "created_at"
            | "updated_at"
          >
        >;
        Update: Flatten<Partial<AgencyTool & { account_password_encrypted: string | null }>>;
        Relationships: [];
      };
      agency_tool_access: {
        Row: Flatten<AgencyToolAccess>;
        Insert: Flatten<Optional<AgencyToolAccess, "id" | "granted_by" | "granted_at">>;
        Update: Flatten<Partial<AgencyToolAccess>>;
        Relationships: [
          {
            foreignKeyName: "agency_tool_access_tool_id_fkey";
            columns: ["tool_id"];
            isOneToOne: false;
            referencedRelation: "agency_tools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agency_tool_access_editor_id_fkey";
            columns: ["editor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      notify_admins: {
        Args: Flatten<{ p_title: string; p_body: string; p_link?: string | null }>;
        Returns: null;
      };
      notify_client_members: {
        Args: Flatten<{
          p_client_id: string;
          p_title: string;
          p_body: string;
          p_link?: string | null;
        }>;
        Returns: null;
      };
      set_content_approval: {
        Args: Flatten<{
          target_content_id: string;
          new_status: ContentStatus;
          feedback?: string | null;
        }>;
        Returns: Flatten<ContentItem>;
      };
      sign_contract: {
        Args: Flatten<{ target_contract_id: string; client_ip?: string | null }>;
        Returns: Flatten<Contract>;
      };
      set_web_asset_approval: {
        Args: Flatten<{
          target_asset_id: string;
          new_status: WebAssetStatus;
          note?: string | null;
        }>;
        Returns: Flatten<WebProjectAsset>;
      };
      vault_add_credential: {
        Args: Flatten<{
          p_label: string;
          p_username?: string | null;
          p_secret: string;
          p_url?: string | null;
          p_notes?: string | null;
          p_client_id?: string | null;
          p_passphrase: string;
        }>;
        Returns: string;
      };
      vault_update_credential: {
        Args: Flatten<{
          p_id: string;
          p_label: string;
          p_username?: string | null;
          p_new_secret?: string | null;
          p_url?: string | null;
          p_notes?: string | null;
          p_client_id?: string | null;
          p_passphrase: string;
        }>;
        Returns: null;
      };
      vault_reveal_credential: {
        Args: Flatten<{ p_id: string; p_passphrase: string }>;
        Returns: string | null;
      };
      social_account_store_token: {
        Args: Flatten<{ p_id: string; p_token: string; p_passphrase: string }>;
        Returns: null;
      };
      social_account_reveal_token: {
        Args: Flatten<{ p_id: string; p_passphrase: string }>;
        Returns: string | null;
      };
      agency_tool_create: {
        Args: Flatten<{
          p_name: string;
          p_purpose?: string | null;
          p_url?: string | null;
          p_account_email?: string | null;
          p_password?: string | null;
          p_notes?: string | null;
          p_cost_amount?: number | null;
          p_cost_currency?: string | null;
          p_cost_frequency?: ToolCostFrequency | null;
          p_next_renewal_date?: string | null;
          p_passphrase: string;
        }>;
        Returns: string;
      };
      agency_tool_update: {
        Args: Flatten<{
          p_id: string;
          p_name: string;
          p_purpose?: string | null;
          p_url?: string | null;
          p_account_email?: string | null;
          p_new_password?: string | null;
          p_notes?: string | null;
          p_cost_amount?: number | null;
          p_cost_currency?: string | null;
          p_cost_frequency?: ToolCostFrequency | null;
          p_next_renewal_date?: string | null;
          p_passphrase: string;
        }>;
        Returns: null;
      };
      agency_tool_reveal_password: {
        Args: Flatten<{ p_id: string; p_passphrase: string }>;
        Returns: string | null;
      };
      report_invoice_payment: {
        Args: Flatten<{ target_invoice_id: string; p_method?: string | null }>;
        Returns: boolean;
      };
      log_audit: {
        Args: Flatten<{
          p_action_type: string;
          p_target_table: string;
          p_target_id: string | null;
          p_summary: string;
          p_client_id?: string | null;
          p_diff?: Record<string, unknown> | null;
        }>;
        Returns: null;
      };
      log_login_event: {
        Args: { p_ip?: string | null };
        Returns: null;
      };
      notify_user: {
        Args: { p_profile_id: string; p_title: string; p_body: string; p_link?: string | null };
        Returns: null;
      };
      list_my_sessions: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          created_at: string;
          updated_at: string;
          user_agent: string | null;
          ip: string | null;
          is_current: boolean;
        }[];
      };
      check_rate_limit: {
        Args: Flatten<{
          p_key: string;
          p_max_hits: number;
          p_window_seconds: number;
          p_block_minutes?: number;
        }>;
        Returns: boolean;
      };
      is_blocked: {
        Args: Flatten<{ p_key: string }>;
        Returns: boolean;
      };
      // Reemplaza el patrón N+1 "última métrica por cuenta social" (ver
      // 0043_latest_social_metrics_rpc.sql) — DISTINCT ON en Postgres, algo
      // que PostgREST no puede expresar en una consulta REST normal.
      latest_social_metrics: {
        Args: Flatten<{ p_account_ids: string[] }>;
        Returns: SocialMetric[];
      };
    };
  };
}
