CREATE TABLE "geo_shelf_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"title" text,
	"kind" text NOT NULL,
	"ownership" text NOT NULL,
	"origin" text NOT NULL,
	"fetch_status" text NOT NULL,
	"last_fetched_at" timestamp,
	"citations" jsonb NOT NULL,
	"placements" jsonb NOT NULL,
	"opportunity" jsonb,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "geo_shelf_sources" ADD CONSTRAINT "geo_shelf_sources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_shelf_sources" ADD CONSTRAINT "geo_shelf_sources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_shelf_sources" ADD CONSTRAINT "geo_shelf_sources_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geoShelfSources_organizationId_idx" ON "geo_shelf_sources" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "geoShelfSources_projectId_updatedAt_idx" ON "geo_shelf_sources" USING btree ("project_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "geoShelfSources_projectId_url_uidx" ON "geo_shelf_sources" USING btree ("project_id","url");