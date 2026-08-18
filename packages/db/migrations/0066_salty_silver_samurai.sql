CREATE TABLE "geo_prompt_suggestions" (
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
CREATE TABLE "google_search_console_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"google_account_email" text,
	"encrypted_access_token" text NOT NULL,
	"encrypted_refresh_token" text NOT NULL,
	"access_token_expires_at" timestamp NOT NULL,
	"site_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"qstash_schedule_id" text,
	"last_synced_at" timestamp,
	"last_error" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "geo_prompt_suggestions" ADD CONSTRAINT "geo_prompt_suggestions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_prompt_suggestions" ADD CONSTRAINT "geo_prompt_suggestions_accepted_prompt_id_geo_prompts_id_fk" FOREIGN KEY ("accepted_prompt_id") REFERENCES "public"."geo_prompts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_search_console_integrations" ADD CONSTRAINT "google_search_console_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_search_console_integrations" ADD CONSTRAINT "google_search_console_integrations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geoPromptSuggestions_organizationId_status_idx" ON "geo_prompt_suggestions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "geoPromptSuggestions_organizationId_prompt_uidx" ON "geo_prompt_suggestions" USING btree ("organization_id","prompt");--> statement-breakpoint
CREATE UNIQUE INDEX "googleSearchConsoleIntegrations_organizationId_uidx" ON "google_search_console_integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "googleSearchConsoleIntegrations_createdByUserId_idx" ON "google_search_console_integrations" USING btree ("created_by_user_id");