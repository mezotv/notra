CREATE TABLE "social_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"scope" text,
	"access_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "workos_org_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "workos_user_id" text;--> statement-breakpoint
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "socialConnections_userId_provider_uidx" ON "social_connections" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "socialConnections_userId_idx" ON "social_connections" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_workos_org_id_unique" UNIQUE("workos_org_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_workos_user_id_unique" UNIQUE("workos_user_id");