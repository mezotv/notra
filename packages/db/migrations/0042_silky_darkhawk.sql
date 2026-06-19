CREATE TABLE "github_app_installations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"installation_id" text NOT NULL,
	"account_id" text NOT NULL,
	"account_login" text NOT NULL,
	"account_name" text,
	"account_avatar_url" text NOT NULL,
	"account_type" text NOT NULL,
	"repository_selection" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "github_app_installation_id" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "github_repository_id" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "github_repository_private" boolean;--> statement-breakpoint
ALTER TABLE "github_app_installations" ADD CONSTRAINT "github_app_installations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_app_installations" ADD CONSTRAINT "github_app_installations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "githubAppInstallations_organizationId_idx" ON "github_app_installations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "githubAppInstallations_createdByUserId_idx" ON "github_app_installations" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "githubAppInstallations_organization_installation_uidx" ON "github_app_installations" USING btree ("organization_id","installation_id");--> statement-breakpoint
ALTER TABLE "github_integrations" ADD CONSTRAINT "github_integrations_github_app_installation_id_github_app_installations_id_fk" FOREIGN KEY ("github_app_installation_id") REFERENCES "public"."github_app_installations"("id") ON DELETE cascade ON UPDATE no action;