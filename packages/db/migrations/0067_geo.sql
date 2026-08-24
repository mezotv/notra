CREATE TABLE "geo_competitors" (
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
CREATE TABLE "geo_content_briefs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"brand_settings_id" text NOT NULL,
	"created_by_user_id" text,
	"topic" text NOT NULL,
	"brief" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"auto_approved" boolean DEFAULT false NOT NULL,
	"run_id" text,
	"collection_id" text,
	"post_id" text,
	"humanized" boolean DEFAULT false NOT NULL,
	"source_kind" text DEFAULT 'manual' NOT NULL,
	"source_id" text,
	"error" text,
	"approved_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_mention_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"scan_id" text NOT NULL,
	"engine" text NOT NULL,
	"prompt_id" text NOT NULL,
	"sequence_id" text,
	"turn" integer DEFAULT 0 NOT NULL,
	"prompt" text NOT NULL,
	"answer" text NOT NULL,
	"mentioned" boolean NOT NULL,
	"position" integer,
	"sentiment" text,
	"competitors" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"language" text DEFAULT 'English' NOT NULL,
	"captured_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_prompt_sequences" (
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
CREATE TABLE "geo_prompt_suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"prompt" text NOT NULL,
	"title" text,
	"source" text DEFAULT 'search_console' NOT NULL,
	"source_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"accepted_prompt_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"prompt" text NOT NULL,
	"title" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_scans" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"company_name" text NOT NULL,
	"aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"competitors" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"languages" text[],
	"engines" text[],
	"enforce_zdr" boolean DEFAULT true NOT NULL,
	"non_zdr_approved_engines" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"scan_interval_hours" integer DEFAULT 48 NOT NULL,
	"qstash_message_id" text,
	"scan_started_at" timestamp,
	"last_scan_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_search_console_integrations" (
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
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"brand_settings_id" text NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_experiments" (
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
ALTER TABLE "organizations" ADD COLUMN "geo_ingest_token_generation" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "content_id" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "content_subtype" text;--> statement-breakpoint
ALTER TABLE "geo_competitors" ADD CONSTRAINT "geo_competitors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_competitors" ADD CONSTRAINT "geo_competitors_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD CONSTRAINT "geo_content_briefs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD CONSTRAINT "geo_content_briefs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD CONSTRAINT "geo_content_briefs_brand_settings_id_brand_settings_id_fk" FOREIGN KEY ("brand_settings_id") REFERENCES "public"."brand_settings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD CONSTRAINT "geo_content_briefs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD CONSTRAINT "geo_content_briefs_collection_id_post_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."post_collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD CONSTRAINT "geo_content_briefs_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_mention_checks" ADD CONSTRAINT "geo_mention_checks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_mention_checks" ADD CONSTRAINT "geo_mention_checks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_mention_checks" ADD CONSTRAINT "geo_mention_checks_scan_id_geo_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."geo_scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_prompt_sequences" ADD CONSTRAINT "geo_prompt_sequences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_prompt_sequences" ADD CONSTRAINT "geo_prompt_sequences_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_prompt_suggestions" ADD CONSTRAINT "geo_prompt_suggestions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_prompt_suggestions" ADD CONSTRAINT "geo_prompt_suggestions_accepted_prompt_id_geo_prompts_id_fk" FOREIGN KEY ("accepted_prompt_id") REFERENCES "public"."geo_prompts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_prompts" ADD CONSTRAINT "geo_prompts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_prompts" ADD CONSTRAINT "geo_prompts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_scans" ADD CONSTRAINT "geo_scans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_scans" ADD CONSTRAINT "geo_scans_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_settings" ADD CONSTRAINT "geo_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_settings" ADD CONSTRAINT "geo_settings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_search_console_integrations" ADD CONSTRAINT "google_search_console_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_search_console_integrations" ADD CONSTRAINT "google_search_console_integrations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_brand_settings_id_brand_settings_id_fk" FOREIGN KEY ("brand_settings_id") REFERENCES "public"."brand_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_experiments" ADD CONSTRAINT "social_experiments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geoCompetitors_organizationId_idx" ON "geo_competitors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "geoCompetitors_projectId_idx" ON "geo_competitors" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "geoCompetitors_projectId_name_uidx" ON "geo_competitors" USING btree ("project_id","name");--> statement-breakpoint
CREATE INDEX "geoContentBriefs_organizationId_createdAt_idx" ON "geo_content_briefs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "geoContentBriefs_projectId_status_idx" ON "geo_content_briefs" USING btree ("project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "geoContentBriefs_open_source_uidx" ON "geo_content_briefs" USING btree ("project_id","source_kind","source_id") WHERE "geo_content_briefs"."source_kind" <> 'manual' AND "geo_content_briefs"."source_id" IS NOT NULL AND "geo_content_briefs"."status" IN ('draft', 'approved', 'writing', 'failed');--> statement-breakpoint
CREATE INDEX "geoMentionChecks_organizationId_capturedAt_idx" ON "geo_mention_checks" USING btree ("organization_id","captured_at");--> statement-breakpoint
CREATE INDEX "geoMentionChecks_projectId_capturedAt_idx" ON "geo_mention_checks" USING btree ("project_id","captured_at");--> statement-breakpoint
CREATE INDEX "geoMentionChecks_projectEnginePrompt_idx" ON "geo_mention_checks" USING btree ("project_id","engine","prompt_id","captured_at");--> statement-breakpoint
CREATE INDEX "geoMentionChecks_scanId_idx" ON "geo_mention_checks" USING btree ("scan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "geoMentionChecks_scanEnginePromptTurnLanguage_uidx" ON "geo_mention_checks" USING btree ("scan_id","engine","prompt_id","turn","language");--> statement-breakpoint
CREATE INDEX "geoPromptSequences_organizationId_idx" ON "geo_prompt_sequences" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "geoPromptSequences_projectId_idx" ON "geo_prompt_sequences" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "geoPromptSuggestions_organizationId_status_idx" ON "geo_prompt_suggestions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "geoPromptSuggestions_organizationId_prompt_uidx" ON "geo_prompt_suggestions" USING btree ("organization_id","prompt");--> statement-breakpoint
CREATE INDEX "geoPrompts_organizationId_idx" ON "geo_prompts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "geoPrompts_projectId_idx" ON "geo_prompts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "geoScans_organizationId_idx" ON "geo_scans" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "geoScans_projectId_startedAt_idx" ON "geo_scans" USING btree ("project_id","started_at");--> statement-breakpoint
CREATE INDEX "geoSettings_organizationId_idx" ON "geo_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "geoSettings_projectId_uidx" ON "geo_settings" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "googleSearchConsoleIntegrations_organizationId_uidx" ON "google_search_console_integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "googleSearchConsoleIntegrations_createdByUserId_idx" ON "google_search_console_integrations" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "projects_organizationId_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_organizationId_sample_uidx" ON "projects" USING btree ("organization_id") WHERE "projects"."is_sample" = true;--> statement-breakpoint
CREATE INDEX "socialExperiments_organizationId_idx" ON "social_experiments" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_content_id_posts_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chatSessions_org_content_deleted_updated_idx" ON "chat_sessions" USING btree ("organization_id","content_id","deleted_at","updated_at");--> statement-breakpoint
UPDATE "posts" AS p
SET "content_subtype" = b."brief"->>'contentType'
FROM "geo_content_briefs" AS b
WHERE b."post_id" = p."id"
  AND p."content_subtype" IS NULL
  AND b."brief"->>'contentType' IN ('guide', 'comparison', 'listicle', 'how-to', 'faq', 'alternatives');--> statement-breakpoint
UPDATE "geo_content_briefs"
SET "brief" = ("brief" - 'contentType') || jsonb_build_object('contentSubtype', "brief"->'contentType')
WHERE "brief" ? 'contentType' AND NOT ("brief" ? 'contentSubtype');
