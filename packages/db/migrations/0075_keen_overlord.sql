DROP INDEX "geoContentBriefs_projectId_source_idx";--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD COLUMN "brand_settings_id" text;--> statement-breakpoint
UPDATE "geo_content_briefs"
SET "brand_settings_id" = "projects"."brand_settings_id"
FROM "projects"
WHERE "geo_content_briefs"."project_id" = "projects"."id";--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ALTER COLUMN "brand_settings_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD CONSTRAINT "geo_content_briefs_brand_settings_id_brand_settings_id_fk" FOREIGN KEY ("brand_settings_id") REFERENCES "public"."brand_settings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "geoContentBriefs_open_source_uidx" ON "geo_content_briefs" USING btree ("project_id","source_kind","source_id") WHERE "geo_content_briefs"."source_kind" <> 'manual' AND "geo_content_briefs"."source_id" IS NOT NULL AND "geo_content_briefs"."status" IN ('draft', 'approved', 'writing', 'failed');
