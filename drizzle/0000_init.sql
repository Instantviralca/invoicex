CREATE TYPE "public"."admin_role" AS ENUM('superadmin', 'support', 'readonly');--> statement-breakpoint
CREATE TYPE "public"."billing_interval" AS ENUM('month', 'year');--> statement-breakpoint
CREATE TYPE "public"."catalogue_type" AS ENUM('product', 'service');--> statement-breakpoint
CREATE TYPE "public"."client_type" AS ENUM('business', 'individual');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('queued', 'sent', 'delivered', 'failed', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."invoice_base_status" AS ENUM('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'void', 'archived');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'administrator', 'staff', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."plan_id" AS ENUM('free', 'starter', 'pro', 'business');--> statement-breakpoint
CREATE TYPE "public"."quote_base_status" AS ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'converted', 'archived');--> statement-breakpoint
CREATE TYPE "public"."recurring_frequency" AS ENUM('weekly', 'monthly', 'quarterly', 'semiannual', 'annually', 'custom');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'pending', 'cancelled', 'expired', 'past_due', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."document_template" AS ENUM('classic', 'modern', 'minimal');--> statement-breakpoint
CREATE TABLE "account_deletion_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"confirmation_text" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "admin_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "admin_role" DEFAULT 'support' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"actor_user_id" uuid,
	"actor_admin_id" uuid,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"metadata" jsonb,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"trading_name" text NOT NULL,
	"legal_name" text,
	"business_type" text,
	"company_number" text,
	"email" text,
	"telephone" text,
	"website" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"region" text,
	"postcode" text,
	"country" text DEFAULT 'GB' NOT NULL,
	"default_currency" varchar(3) DEFAULT 'GBP' NOT NULL,
	"time_zone" text DEFAULT 'Europe/London' NOT NULL,
	"invoice_prefix" text DEFAULT 'INV-' NOT NULL,
	"next_invoice_number" integer DEFAULT 1 NOT NULL,
	"quote_prefix" text DEFAULT 'QUO-' NOT NULL,
	"next_quote_number" integer DEFAULT 1 NOT NULL,
	"default_payment_terms_days" integer DEFAULT 30 NOT NULL,
	"default_invoice_notes" text,
	"default_quote_notes" text,
	"default_payment_instructions" text,
	"vat_registered" boolean DEFAULT false NOT NULL,
	"vat_number" text,
	"default_tax_rate_percent" text DEFAULT '0' NOT NULL,
	"prices_inclusive_of_tax" boolean DEFAULT false NOT NULL,
	"logo_file_id" uuid,
	"accent_colour" text DEFAULT '#1D4ED8' NOT NULL,
	"document_template" "document_template" DEFAULT 'classic' NOT NULL,
	"is_default" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalogue_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sku" text,
	"type" "catalogue_type" DEFAULT 'service' NOT NULL,
	"unit" text DEFAULT 'unit' NOT NULL,
	"unit_price_minor" integer NOT NULL,
	"default_tax_rate_percent" text DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'GBP' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"business_profile_id" uuid,
	"client_type" "client_type" DEFAULT 'business' NOT NULL,
	"contact_name" text NOT NULL,
	"business_name" text,
	"email" text,
	"telephone" text,
	"billing_address_line1" text,
	"billing_address_line2" text,
	"billing_city" text,
	"billing_region" text,
	"billing_postcode" text,
	"billing_country" text DEFAULT 'GB',
	"service_address_line1" text,
	"service_address_line2" text,
	"service_city" text,
	"service_region" text,
	"service_postcode" text,
	"service_country" text,
	"company_number" text,
	"vat_number" text,
	"default_currency" varchar(3) DEFAULT 'GBP',
	"default_payment_terms_days" integer,
	"internal_notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"category" text NOT NULL,
	"message" text NOT NULL,
	"ip_hash" text,
	"honeypot" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cookie_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anonymous_id" text,
	"user_id" uuid,
	"version" text NOT NULL,
	"necessary" boolean DEFAULT true NOT NULL,
	"analytics" boolean DEFAULT false NOT NULL,
	"marketing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_export_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"file_asset_id" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"user_id" uuid,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"template" text NOT NULL,
	"status" "email_status" DEFAULT 'queued' NOT NULL,
	"provider_message_id" text,
	"related_type" text,
	"related_id" uuid,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"uploaded_by_user_id" uuid,
	"storage_key" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"purpose" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"catalogue_item_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"quantity" text NOT NULL,
	"unit" text DEFAULT 'unit' NOT NULL,
	"unit_price_minor" integer NOT NULL,
	"discount_minor" integer DEFAULT 0 NOT NULL,
	"tax_rate_percent" text DEFAULT '0' NOT NULL,
	"line_subtotal_minor" integer DEFAULT 0 NOT NULL,
	"line_tax_minor" integer DEFAULT 0 NOT NULL,
	"line_total_minor" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"business_profile_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"source_quote_id" uuid,
	"invoice_number" text NOT NULL,
	"status" "invoice_base_status" DEFAULT 'draft' NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"currency" varchar(3) DEFAULT 'GBP' NOT NULL,
	"customer_reference" text,
	"billing_address_snapshot" jsonb,
	"service_address_snapshot" jsonb,
	"subtotal_minor" integer DEFAULT 0 NOT NULL,
	"discount_total_minor" integer DEFAULT 0 NOT NULL,
	"tax_total_minor" integer DEFAULT 0 NOT NULL,
	"shipping_minor" integer DEFAULT 0 NOT NULL,
	"grand_total_minor" integer DEFAULT 0 NOT NULL,
	"amount_paid_minor" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"payment_instructions" text,
	"terms" text,
	"footer_note" text,
	"template" "document_template" DEFAULT 'classic' NOT NULL,
	"accent_colour" text,
	"prices_inclusive_of_tax" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"public_token" text,
	"reminders_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_name" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"metadata" jsonb,
	CONSTRAINT "job_runs_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "mollie_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"mollie_payment_id" text NOT NULL,
	"mollie_customer_id" text,
	"status" text NOT NULL,
	"amount_value" text NOT NULL,
	"amount_currency" text NOT NULL,
	"sequence_type" text,
	"description" text,
	"metadata" jsonb,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mollie_payments_mollie_payment_id_unique" UNIQUE("mollie_payment_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "payment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'GBP' NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"method" text,
	"reference" text,
	"notes" text,
	"is_user_entered" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"catalogue_item_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"quantity" text NOT NULL,
	"unit" text DEFAULT 'unit' NOT NULL,
	"unit_price_minor" integer NOT NULL,
	"discount_minor" integer DEFAULT 0 NOT NULL,
	"tax_rate_percent" text DEFAULT '0' NOT NULL,
	"line_subtotal_minor" integer DEFAULT 0 NOT NULL,
	"line_tax_minor" integer DEFAULT 0 NOT NULL,
	"line_total_minor" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_public_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quote_public_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "quote_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"action" text NOT NULL,
	"respondent_name" text NOT NULL,
	"comment" text,
	"ip_hash" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"business_profile_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"quote_number" text NOT NULL,
	"status" "quote_base_status" DEFAULT 'draft' NOT NULL,
	"issue_date" date NOT NULL,
	"valid_until" date NOT NULL,
	"currency" varchar(3) DEFAULT 'GBP' NOT NULL,
	"customer_reference" text,
	"billing_address_snapshot" jsonb,
	"subtotal_minor" integer DEFAULT 0 NOT NULL,
	"discount_total_minor" integer DEFAULT 0 NOT NULL,
	"tax_total_minor" integer DEFAULT 0 NOT NULL,
	"shipping_minor" integer DEFAULT 0 NOT NULL,
	"grand_total_minor" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"terms" text,
	"footer_note" text,
	"template" "document_template" DEFAULT 'classic' NOT NULL,
	"accent_colour" text,
	"prices_inclusive_of_tax" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"converted_at" timestamp with time zone,
	"converted_invoice_id" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"business_profile_id" uuid NOT NULL,
	"template_invoice_id" uuid,
	"frequency" "recurring_frequency" NOT NULL,
	"custom_interval_days" integer,
	"start_date" date NOT NULL,
	"end_date" date,
	"next_run_date" date NOT NULL,
	"auto_send" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_run_key" text,
	"line_items_template" jsonb NOT NULL,
	"notes" text,
	"terms" text,
	"payment_instructions" text,
	"currency" varchar(3) DEFAULT 'GBP' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"invoice_id" uuid,
	"client_id" uuid,
	"offset_days" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_sent_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "subscription_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"subscription_id" uuid,
	"event_type" text NOT NULL,
	"mollie_resource_id" text,
	"payload" jsonb,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"plan_id" "plan_id" DEFAULT 'free' NOT NULL,
	"interval" "billing_interval" DEFAULT 'month' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"mollie_customer_id" text,
	"mollie_subscription_id" text,
	"mollie_mandate_id" text,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp with time zone,
	"pending_plan_id" "plan_id",
	"pending_interval" "billing_interval",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "support_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"workspace_id" uuid,
	"user_id" uuid,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"period_key" text NOT NULL,
	"documents_created" integer DEFAULT 0 NOT NULL,
	"emails_sent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"password_hash" text,
	"image" text,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"onboarding_step" integer DEFAULT 1 NOT NULL,
	"suspended_at" timestamp with time zone,
	"suspended_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_failures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'mollie' NOT NULL,
	"resource_id" text,
	"payload" jsonb,
	"error_message" text NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" NOT NULL,
	"invited_email" text,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"plan_id" "plan_id" DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_items" ADD CONSTRAINT "catalogue_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_business_profile_id_business_profiles_id_fk" FOREIGN KEY ("business_profile_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_snapshots" ADD CONSTRAINT "invoice_snapshots_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_snapshots" ADD CONSTRAINT "invoice_snapshots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_business_profile_id_business_profiles_id_fk" FOREIGN KEY ("business_profile_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mollie_payments" ADD CONSTRAINT "mollie_payments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_public_tokens" ADD CONSTRAINT "quote_public_tokens_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_public_tokens" ADD CONSTRAINT "quote_public_tokens_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_responses" ADD CONSTRAINT "quote_responses_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_responses" ADD CONSTRAINT "quote_responses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_snapshots" ADD CONSTRAINT "quote_snapshots_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_snapshots" ADD CONSTRAINT "quote_snapshots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_business_profile_id_business_profiles_id_fk" FOREIGN KEY ("business_profile_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_business_profile_id_business_profiles_id_fk" FOREIGN KEY ("business_profile_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_template_invoice_id_invoices_id_fk" FOREIGN KEY ("template_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ADD CONSTRAINT "reminder_schedules_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ADD CONSTRAINT "reminder_schedules_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ADD CONSTRAINT "reminder_schedules_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_notes" ADD CONSTRAINT "support_notes_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_idx" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "audit_logs_workspace_idx" ON "audit_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "business_profiles_workspace_idx" ON "business_profiles" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "catalogue_workspace_idx" ON "catalogue_items" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "clients_workspace_idx" ON "clients" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "clients_email_idx" ON "clients" USING btree ("workspace_id","email");--> statement-breakpoint
CREATE INDEX "email_logs_workspace_idx" ON "email_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "invoice_lines_invoice_idx" ON "invoice_line_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_number_workspace_idx" ON "invoices" USING btree ("workspace_id","invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_workspace_status_idx" ON "invoices" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "invoices_due_date_idx" ON "invoices" USING btree ("workspace_id","due_date");--> statement-breakpoint
CREATE INDEX "job_runs_name_idx" ON "job_runs" USING btree ("job_name");--> statement-breakpoint
CREATE INDEX "mollie_payments_workspace_idx" ON "mollie_payments" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "payment_records_invoice_idx" ON "payment_records" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "quote_lines_quote_idx" ON "quote_line_items" USING btree ("quote_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quote_number_workspace_idx" ON "quotes" USING btree ("workspace_id","quote_number");--> statement-breakpoint
CREATE INDEX "quotes_workspace_status_idx" ON "quotes" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "recurring_next_run_idx" ON "recurring_invoices" USING btree ("next_run_date","active");--> statement-breakpoint
CREATE INDEX "subscriptions_mollie_idx" ON "subscriptions" USING btree ("mollie_subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_workspace_period_idx" ON "usage_counters" USING btree ("workspace_id","period_key");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_token_idx" ON "verification_tokens" USING btree ("identifier","token");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_member_unique" ON "workspace_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" USING btree ("user_id");