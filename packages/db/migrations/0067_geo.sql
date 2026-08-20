CREATE TABLE IF NOT EXISTS "geo_competitors" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"synonyms" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"kind" text DEFAULT 'direct' NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "geo_prompt_sequences" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"steps" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "geo_prompt_suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"prompt" text NOT NULL,
	"source" text DEFAULT 'search_console' NOT NULL,
	"source_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"accepted_prompt_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "geo_prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"prompt" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "geo_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"company_name" text NOT NULL,
	"aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"competitors" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"languages" text[],
	"enabled" boolean DEFAULT true NOT NULL,
	"scan_started_at" timestamp,
	"last_scan_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "google_search_console_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text,
	"google_account_email" text,
	"encrypted_access_token" text NOT NULL,
	"encrypted_refresh_token" text NOT NULL,
	"access_token_expires_at" timestamp NOT NULL,
	"site_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"qstash_schedule_id" text,
	"last_synced_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_experiments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"hypothesis" text,
	"provider" text NOT NULL,
	"variant_a_post_id" text NOT NULL,
	"variant_b_post_id" text NOT NULL,
	"metric" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"winner" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "geo_competitors" ADD CONSTRAINT "geo_competitors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "geo_competitors" ADD CONSTRAINT "geo_competitors_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "geo_prompt_sequences" ADD CONSTRAINT "geo_prompt_sequences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "geo_prompt_sequences" ADD CONSTRAINT "geo_prompt_sequences_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "geo_prompt_suggestions" ADD CONSTRAINT "geo_prompt_suggestions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "geo_prompt_suggestions" ADD CONSTRAINT "geo_prompt_suggestions_accepted_prompt_id_geo_prompts_id_fk" FOREIGN KEY ("accepted_prompt_id") REFERENCES "public"."geo_prompts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "geo_prompts" ADD CONSTRAINT "geo_prompts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "geo_prompts" ADD CONSTRAINT "geo_prompts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "geo_settings" ADD CONSTRAINT "geo_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "geo_settings" ADD CONSTRAINT "geo_settings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "google_search_console_integrations" ADD CONSTRAINT "google_search_console_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "google_search_console_integrations" ADD CONSTRAINT "google_search_console_integrations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "social_experiments" ADD CONSTRAINT "social_experiments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geoCompetitors_organizationId_idx" ON "geo_competitors" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geoCompetitors_projectId_idx" ON "geo_competitors" USING btree ("project_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "geoCompetitors_projectId_name_uidx" ON "geo_competitors" USING btree ("project_id","name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geoPromptSequences_organizationId_idx" ON "geo_prompt_sequences" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geoPromptSequences_projectId_idx" ON "geo_prompt_sequences" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geoPromptSuggestions_organizationId_status_idx" ON "geo_prompt_suggestions" USING btree ("organization_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "geoPromptSuggestions_organizationId_prompt_uidx" ON "geo_prompt_suggestions" USING btree ("organization_id","prompt");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geoPrompts_organizationId_idx" ON "geo_prompts" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geoPrompts_projectId_idx" ON "geo_prompts" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geoSettings_organizationId_idx" ON "geo_settings" USING btree ("organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "geoSettings_projectId_uidx" ON "geo_settings" USING btree ("project_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "googleSearchConsoleIntegrations_organizationId_uidx" ON "google_search_console_integrations" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "googleSearchConsoleIntegrations_createdByUserId_idx" ON "google_search_console_integrations" USING btree ("created_by_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_organizationId_idx" ON "projects" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "socialExperiments_organizationId_idx" ON "social_experiments" USING btree ("organization_id");
