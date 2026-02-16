ALTER TABLE "github_integrations" ADD COLUMN "owner" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "repo" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "default_branch" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "repository_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "encrypted_webhook_secret" text;--> statement-breakpoint
CREATE UNIQUE INDEX "githubIntegrations_organization_owner_repo_uidx" ON "github_integrations" USING btree ("organization_id","owner","repo");