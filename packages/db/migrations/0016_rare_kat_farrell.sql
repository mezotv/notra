CREATE TABLE "connected_social_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"profile_image_url" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"scope" text,
	"token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "connected_social_accounts" ADD CONSTRAINT "connected_social_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "connectedSocialAccounts_organizationId_idx" ON "connected_social_accounts" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "connectedSocialAccounts_org_provider_account_uidx" ON "connected_social_accounts" USING btree ("organization_id","provider","provider_account_id");