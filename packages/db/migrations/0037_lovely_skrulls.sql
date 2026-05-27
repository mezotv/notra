CREATE TABLE "github_app_installations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"installation_id" text NOT NULL,
	"account_login" text,
	"account_type" text,
	"installed_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "github_app_installation_record_id" text;--> statement-breakpoint
ALTER TABLE "github_app_installations" ADD CONSTRAINT "github_app_installations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_app_installations" ADD CONSTRAINT "github_app_installations_installed_by_user_id_users_id_fk" FOREIGN KEY ("installed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "githubAppInstallations_organizationId_idx" ON "github_app_installations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "githubAppInstallations_installationId_idx" ON "github_app_installations" USING btree ("installation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "githubAppInstallations_org_installation_uidx" ON "github_app_installations" USING btree ("organization_id","installation_id");--> statement-breakpoint
INSERT INTO "github_app_installations" (
	"id",
	"organization_id",
	"installation_id",
	"account_login",
	"account_type",
	"installed_by_user_id",
	"created_at",
	"updated_at"
)
SELECT
	concat('ghai_', md5("organization_id" || ':' || "github_app_installation_id")),
	"organization_id",
	"github_app_installation_id",
	max("github_app_installation_account_login"),
	max("github_app_installation_account_type"),
	min("created_by_user_id"),
	now(),
	now()
FROM "github_integrations"
WHERE
	"auth_type" = 'github_app'
	AND "github_app_installation_id" IS NOT NULL
GROUP BY
	"organization_id",
	"github_app_installation_id"
ON CONFLICT ("organization_id", "installation_id") DO NOTHING;--> statement-breakpoint
UPDATE "github_integrations"
SET "github_app_installation_record_id" = concat('ghai_', md5("organization_id" || ':' || "github_app_installation_id"))
WHERE
	"auth_type" = 'github_app'
	AND "github_app_installation_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD CONSTRAINT "github_integrations_github_app_installation_record_id_github_app_installations_id_fk" FOREIGN KEY ("github_app_installation_record_id") REFERENCES "public"."github_app_installations"("id") ON DELETE set null ON UPDATE no action;
