DROP INDEX "brandSettings_organizationId_uidx";--> statement-breakpoint
ALTER TABLE "brand_settings" ADD COLUMN "name" text DEFAULT 'Default' NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_settings" ADD COLUMN "is_default" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_settings" ADD COLUMN "website_url" text;--> statement-breakpoint
CREATE UNIQUE INDEX "brandSettings_org_name_uidx" ON "brand_settings" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "brandSettings_organizationId_idx" ON "brand_settings" USING btree ("organization_id");