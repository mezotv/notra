ALTER TABLE "github_integrations" ADD COLUMN IF NOT EXISTS "owner" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN IF NOT EXISTS "repo" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN IF NOT EXISTS "default_branch" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN IF NOT EXISTS "repository_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN IF NOT EXISTS "encrypted_webhook_secret" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "githubIntegrations_organization_owner_repo_uidx" ON "github_integrations" USING btree ("organization_id","owner","repo");
