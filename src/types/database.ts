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
export type ReportStatus = "draft" | "published";
export type CrmLeadStage =
  | "nuevo"
  | "contactado"
  | "calificado"
  | "propuesta"
  | "ganado"
  | "perdido";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
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

export interface BillingInvoice {
  id: string;
  client_id: string;
  plan_id: string | null;
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
        Insert: Flatten<Optional<Profile, "full_name" | "role" | "avatar_url" | "created_at">>;
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
            "id" | "can_view_chat" | "can_view_drive" | "assigned_by" | "created_at"
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
          Optional<SocialAccount, "id" | "display_name" | "connected_by" | "connected_at">
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
    };
  };
}
