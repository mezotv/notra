ALTER TABLE "projects" DROP CONSTRAINT "projects_brand_settings_id_brand_settings_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "brand_settings_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_brand_settings_id_brand_settings_id_fk" FOREIGN KEY ("brand_settings_id") REFERENCES "public"."brand_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "is_default";