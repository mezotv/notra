CREATE TABLE "tracked_social_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"profile_image_url" text,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracked_social_accounts" ADD CONSTRAINT "tracked_social_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trackedSocialAccounts_organizationId_idx" ON "tracked_social_accounts" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trackedSocialAccounts_org_provider_account_uidx" ON "tracked_social_accounts" USING btree ("organization_id","provider","provider_account_id");