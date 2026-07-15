ALTER TABLE "mcp_server_integrations" ADD COLUMN "author" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "brand_color" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "logo_light_url" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "logo_dark_url" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "store_status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "mcp_tool_index" ADD COLUMN "action_phrase_present" text;--> statement-breakpoint
ALTER TABLE "mcp_tool_index" ADD COLUMN "action_phrase_past" text;--> statement-breakpoint
CREATE INDEX "mcpServerIntegrations_storeStatus_idx" ON "mcp_server_integrations" USING btree ("store_status");--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD CONSTRAINT "mcpServerIntegrations_storeStatus_check" CHECK ("mcp_server_integrations"."store_status" IN ('draft', 'pending_review', 'live', 'rejected'));