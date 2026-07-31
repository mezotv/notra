CREATE TABLE "slack_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"encrypted_bot_token" text NOT NULL,
	"slack_team_id" text NOT NULL,
	"slack_team_name" text,
	"slack_bot_user_id" text,
	"allowed_channel_ids" jsonb,
	"notification_channel_id" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "slack_integrations" ADD CONSTRAINT "slack_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slack_integrations" ADD CONSTRAINT "slack_integrations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "slackIntegrations_organizationId_idx" ON "slack_integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "slackIntegrations_createdByUserId_idx" ON "slack_integrations" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "slackIntegrations_teamId_uidx" ON "slack_integrations" USING btree ("slack_team_id");