ALTER TABLE "mcp_server_integrations" ADD COLUMN "auth_type" text DEFAULT 'headers' NOT NULL;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "oauth_authorization_server_url" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "oauth_resource" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "oauth_scope" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "oauth_client_id" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "encrypted_oauth_client_secret" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "encrypted_oauth_access_token" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "encrypted_oauth_refresh_token" text;--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "oauth_token_expires_at" timestamp;