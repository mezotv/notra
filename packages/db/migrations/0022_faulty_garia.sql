CREATE TABLE "linear_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"encrypted_access_token" text,
	"linear_organization_id" text NOT NULL,
	"linear_organization_name" text,
	"linear_team_id" text,
	"linear_team_name" text,
	"encrypted_webhook_secret" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "linear_integrations" ADD CONSTRAINT "linear_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linear_integrations" ADD CONSTRAINT "linear_integrations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "linearIntegrations_organizationId_idx" ON "linear_integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "linearIntegrations_createdByUserId_idx" ON "linear_integrations" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "linearIntegrations_org_linearOrg_team_uidx" ON "linear_integrations" USING btree ("organization_id","linear_organization_id","linear_team_id");