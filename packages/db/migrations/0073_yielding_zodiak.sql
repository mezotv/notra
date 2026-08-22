CREATE TABLE "geo_content_briefs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_by_user_id" text,
	"topic" text NOT NULL,
	"brief" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"auto_approved" boolean DEFAULT false NOT NULL,
	"run_id" text,
	"collection_id" text,
	"post_id" text,
	"humanized" boolean DEFAULT false NOT NULL,
	"error" text,
	"approved_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD CONSTRAINT "geo_content_briefs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD CONSTRAINT "geo_content_briefs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD CONSTRAINT "geo_content_briefs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD CONSTRAINT "geo_content_briefs_collection_id_post_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."post_collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD CONSTRAINT "geo_content_briefs_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geoContentBriefs_organizationId_createdAt_idx" ON "geo_content_briefs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "geoContentBriefs_projectId_status_idx" ON "geo_content_briefs" USING btree ("project_id","status");