CREATE TABLE "geo_prospect_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text,
	"share_token" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"company_name" text DEFAULT '' NOT NULL,
	"company_domain" text DEFAULT '' NOT NULL,
	"visibility_score" integer,
	"model_count" integer DEFAULT 0 NOT NULL,
	"prompt_count" integer DEFAULT 0 NOT NULL,
	"report" jsonb NOT NULL,
	"last_scanned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "geo_prospect_reports" ADD CONSTRAINT "geo_prospect_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_prospect_reports" ADD CONSTRAINT "geo_prospect_reports_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geoProspectReports_organizationId_idx" ON "geo_prospect_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "geoProspectReports_shareToken_uidx" ON "geo_prospect_reports" USING btree ("share_token");