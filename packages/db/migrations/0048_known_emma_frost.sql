CREATE TABLE "mcp_oauth_credentials" (
	"server_integration_id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"connected_by_user_id" text NOT NULL,
	"encrypted_tokens" text NOT NULL,
	"encrypted_client_information" text,
	"encrypted_authorization_server_information" text,
	"access_token_expires_at" timestamp,
	"access_token_refresh_at" timestamp,
	"status" text DEFAULT 'connected' NOT NULL,
	"token_version" integer DEFAULT 1 NOT NULL,
	"refresh_lease_id" text,
	"refresh_lease_expires_at" timestamp,
	"last_refreshed_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mcpOAuthCredentials_status_check" CHECK ("mcp_oauth_credentials"."status" IN ('connected', 'refreshing', 'reauth_required'))
);
--> statement-breakpoint
CREATE TABLE "mcp_oauth_pending_authorizations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"server_integration_id" text,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"callback_path" text NOT NULL,
	"state_hash" text NOT NULL,
	"encrypted_state" text NOT NULL,
	"encrypted_code_verifier" text,
	"encrypted_client_information" text,
	"encrypted_authorization_server_information" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mcp_oauth_pending_authorizations_state_hash_unique" UNIQUE("state_hash")
);
--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD COLUMN "auth_type" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
UPDATE "mcp_server_integrations"
SET "auth_type" = 'headers'
WHERE "encrypted_headers" <> '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "mcp_oauth_credentials" ADD CONSTRAINT "mcp_oauth_credentials_server_integration_id_mcp_server_integrations_id_fk" FOREIGN KEY ("server_integration_id") REFERENCES "public"."mcp_server_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_credentials" ADD CONSTRAINT "mcp_oauth_credentials_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_credentials" ADD CONSTRAINT "mcp_oauth_credentials_connected_by_user_id_users_id_fk" FOREIGN KEY ("connected_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_credentials" ADD CONSTRAINT "mcpOAuthCredentials_org_server_fk" FOREIGN KEY ("organization_id","server_integration_id") REFERENCES "public"."mcp_server_integrations"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_pending_authorizations" ADD CONSTRAINT "mcp_oauth_pending_authorizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_pending_authorizations" ADD CONSTRAINT "mcp_oauth_pending_authorizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_pending_authorizations" ADD CONSTRAINT "mcp_oauth_pending_authorizations_server_integration_id_mcp_server_integrations_id_fk" FOREIGN KEY ("server_integration_id") REFERENCES "public"."mcp_server_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_pending_authorizations" ADD CONSTRAINT "mcpOAuthPendingAuthorizations_org_server_fk" FOREIGN KEY ("organization_id","server_integration_id") REFERENCES "public"."mcp_server_integrations"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mcpOAuthCredentials_organizationId_idx" ON "mcp_oauth_credentials" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "mcpOAuthCredentials_connectedByUserId_idx" ON "mcp_oauth_credentials" USING btree ("connected_by_user_id");--> statement-breakpoint
CREATE INDEX "mcpOAuthPendingAuthorizations_organizationId_idx" ON "mcp_oauth_pending_authorizations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "mcpOAuthPendingAuthorizations_userId_idx" ON "mcp_oauth_pending_authorizations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mcpOAuthPendingAuthorizations_serverIntegrationId_idx" ON "mcp_oauth_pending_authorizations" USING btree ("server_integration_id");--> statement-breakpoint
CREATE INDEX "mcpOAuthPendingAuthorizations_expiresAt_idx" ON "mcp_oauth_pending_authorizations" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "mcp_server_integrations" ADD CONSTRAINT "mcpServerIntegrations_authType_check" CHECK ("mcp_server_integrations"."auth_type" IN ('none', 'headers', 'oauth'));
