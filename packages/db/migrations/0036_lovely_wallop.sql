CREATE TABLE "mcp_server_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"encrypted_headers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD CONSTRAINT "mcp_server_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD CONSTRAINT "mcp_server_integrations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mcpServerIntegrations_organizationId_idx" ON "mcp_server_integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "mcpServerIntegrations_createdByUserId_idx" ON "mcp_server_integrations" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mcpServerIntegrations_org_name_uidx" ON "mcp_server_integrations" USING btree ("organization_id","name");
