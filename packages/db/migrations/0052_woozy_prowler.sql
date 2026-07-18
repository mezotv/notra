CREATE TABLE "granola_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"encrypted_api_key" text NOT NULL,
	"workspace_name" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "granola_integrations" ADD CONSTRAINT "granola_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "granola_integrations" ADD CONSTRAINT "granola_integrations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "granolaIntegrations_organizationId_idx" ON "granola_integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "granolaIntegrations_createdByUserId_idx" ON "granola_integrations" USING btree ("created_by_user_id");