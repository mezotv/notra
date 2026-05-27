ALTER TABLE "github_integrations" ADD COLUMN "auth_type" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "github_app_installation_id" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "github_app_installation_account_login" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "github_app_installation_account_type" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "github_app_repository_id" integer;