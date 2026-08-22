ALTER TABLE "geo_content_briefs" ADD COLUMN "source_kind" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD COLUMN "source_id" text;--> statement-breakpoint
CREATE INDEX "geoContentBriefs_projectId_source_idx" ON "geo_content_briefs" USING btree ("project_id","source_kind","source_id");