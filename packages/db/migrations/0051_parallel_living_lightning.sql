DROP INDEX "mcpServerIntegrations_org_name_uidx";--> statement-breakpoint
ALTER TABLE "mcp_oauth_pending_authorizations" ADD COLUMN "store_source_integration_id" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "resource_type" text DEFAULT 'connection' NOT NULL;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "author" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "brand_color" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "logo_light_url" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "logo_dark_url" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "store_source_integration_id" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "store_status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "mcp_tool_index" ADD COLUMN "action_phrase_present" text;--> statement-breakpoint
ALTER TABLE "mcp_tool_index" ADD COLUMN "action_phrase_past" text;--> statement-breakpoint
ALTER TABLE "mcp_oauth_pending_authorizations" ADD CONSTRAINT "mcpOAuthPendingAuthorizations_storeSourceIntegrationId_fk" FOREIGN KEY ("store_source_integration_id") REFERENCES "public"."mcp_server_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD CONSTRAINT "mcpServerIntegrations_storeSourceIntegrationId_fk" FOREIGN KEY ("store_source_integration_id") REFERENCES "public"."mcp_server_integrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mcpOAuthPendingAuthorizations_storeSourceIntegrationId_idx" ON "mcp_oauth_pending_authorizations" USING btree ("store_source_integration_id");--> statement-breakpoint
CREATE INDEX "mcpServerIntegrations_resourceType_idx" ON "mcp_server_integrations" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "mcpServerIntegrations_storeStatus_idx" ON "mcp_server_integrations" USING btree ("store_status");--> statement-breakpoint
CREATE INDEX "mcpServerIntegrations_storeSourceIntegrationId_idx" ON "mcp_server_integrations" USING btree ("store_source_integration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mcpServerIntegrations_org_resourceType_name_uidx" ON "mcp_server_integrations" USING btree ("organization_id","resource_type","name");--> statement-breakpoint
CREATE UNIQUE INDEX "mcpServerIntegrations_org_storeSource_uidx" ON "mcp_server_integrations" USING btree ("organization_id","store_source_integration_id") WHERE "mcp_server_integrations"."store_source_integration_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD CONSTRAINT "mcpServerIntegrations_storeStatus_check" CHECK ("mcp_server_integrations"."store_status" IN ('draft', 'pending_review', 'live', 'rejected'));--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD CONSTRAINT "mcpServerIntegrations_resourceType_check" CHECK ("mcp_server_integrations"."resource_type" IN ('connection', 'store_listing'));--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD CONSTRAINT "mcpServerIntegrations_resourceState_check" CHECK ((
        ("mcp_server_integrations"."resource_type" = 'store_listing' AND "mcp_server_integrations"."store_source_integration_id" IS NULL)
        OR
        ("mcp_server_integrations"."resource_type" = 'connection' AND "mcp_server_integrations"."store_status" = 'draft' AND "mcp_server_integrations"."review_note" IS NULL AND "mcp_server_integrations"."submitted_at" IS NULL AND "mcp_server_integrations"."reviewed_at" IS NULL)
      ));
