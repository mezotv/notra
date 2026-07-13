CREATE TYPE "public"."onboarding_suggestion_type" AS ENUM('schedule_automation', 'event_automation');--> statement-breakpoint
CREATE TABLE "onboarding_suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"type" "onboarding_suggestion_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"data" jsonb,
	"dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_references" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "brand_references" ADD COLUMN "source_snapshot_key" text;--> statement-breakpoint
ALTER TABLE "brand_references" ADD COLUMN "source_content_hash" text;--> statement-breakpoint
ALTER TABLE "brand_references" ADD COLUMN "source_captured_at" timestamp;--> statement-breakpoint
UPDATE "brand_references"
SET
	"source_url" = COALESCE("metadata"->>'sourceUrl', "metadata"->>'url'),
	"source_captured_at" = "created_at"
WHERE COALESCE("metadata"->>'sourceUrl', "metadata"->>'url') IS NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "onboarding_agent_ran" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "onboarding_agent_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "onboarding_suggestions" ADD CONSTRAINT "onboarding_suggestions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "onboardingSuggestions_org_type_idx" ON "onboarding_suggestions" USING btree ("organization_id","type");--> statement-breakpoint
CREATE INDEX "brandReferences_brandSettingsId_sourceUrl_idx" ON "brand_references" USING btree ("brand_settings_id","source_url");
