CREATE TABLE "mcp_session_tool_activations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"session_id" text NOT NULL,
	"surface" text NOT NULL,
	"mcp_tool_index_id" text NOT NULL,
	"runtime_tool_name" text NOT NULL,
	"source_query" text,
	"activated_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mcp_tool_index" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"server_integration_id" text NOT NULL,
	"server_tool_name" text NOT NULL,
	"runtime_tool_name" text NOT NULL,
	"title" text,
	"description" text,
	"input_schema" jsonb NOT NULL,
	"output_schema" jsonb,
	"annotations" jsonb,
	"meta" jsonb,
	"schema_hash" text NOT NULL,
	"search_text" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_seen_at" timestamp,
	"last_indexed_at" timestamp DEFAULT now() NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "last_tool_sync_at" timestamp;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "tool_sync_status" text DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "tool_sync_error" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "indexed_tool_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "mcp_session_tool_activations" ADD CONSTRAINT "mcp_session_tool_activations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_session_tool_activations" ADD CONSTRAINT "mcp_session_tool_activations_mcp_tool_index_id_mcp_tool_index_id_fk" FOREIGN KEY ("mcp_tool_index_id") REFERENCES "public"."mcp_tool_index"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_tool_index" ADD CONSTRAINT "mcp_tool_index_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_tool_index" ADD CONSTRAINT "mcp_tool_index_server_integration_id_mcp_server_integrations_id_fk" FOREIGN KEY ("server_integration_id") REFERENCES "public"."mcp_server_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mcpSessionToolActivations_session_tool_uidx" ON "mcp_session_tool_activations" USING btree ("organization_id","session_id","surface","mcp_tool_index_id");--> statement-breakpoint
CREATE INDEX "mcpSessionToolActivations_session_idx" ON "mcp_session_tool_activations" USING btree ("organization_id","session_id","surface");--> statement-breakpoint
CREATE INDEX "mcpSessionToolActivations_expiresAt_idx" ON "mcp_session_tool_activations" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "mcpToolIndex_server_tool_uidx" ON "mcp_tool_index" USING btree ("server_integration_id","server_tool_name");--> statement-breakpoint
CREATE UNIQUE INDEX "mcpToolIndex_org_runtime_tool_uidx" ON "mcp_tool_index" USING btree ("organization_id","runtime_tool_name");--> statement-breakpoint
CREATE INDEX "mcpToolIndex_organizationId_status_idx" ON "mcp_tool_index" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "mcpToolIndex_serverIntegrationId_status_idx" ON "mcp_tool_index" USING btree ("server_integration_id","status");--> statement-breakpoint
CREATE INDEX "mcpToolIndex_searchText_gin_idx" ON "mcp_tool_index" USING gin (to_tsvector('english', "search_text"));