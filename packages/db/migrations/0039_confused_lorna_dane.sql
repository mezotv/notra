CREATE UNIQUE INDEX "mcpServerIntegrations_org_id_uidx" ON "mcp_server_integrations" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "mcpToolIndex_org_id_uidx" ON "mcp_tool_index" USING btree ("organization_id","id");--> statement-breakpoint
ALTER TABLE "mcp_tool_index" ADD CONSTRAINT "mcpToolIndex_org_server_fk" FOREIGN KEY ("organization_id","server_integration_id") REFERENCES "public"."mcp_server_integrations"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_session_tool_activations" ADD CONSTRAINT "mcpSessionToolActivations_org_tool_fk" FOREIGN KEY ("organization_id","mcp_tool_index_id") REFERENCES "public"."mcp_tool_index"("organization_id","id") ON DELETE cascade ON UPDATE no action;
