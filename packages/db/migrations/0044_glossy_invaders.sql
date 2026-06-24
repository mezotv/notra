CREATE TYPE "public"."brand_guideline_asset_kind" AS ENUM('logo', 'wordmark');--> statement-breakpoint
CREATE TYPE "public"."brand_guideline_asset_variant" AS ENUM('light', 'dark');--> statement-breakpoint
CREATE TYPE "public"."brand_guideline_color_role" AS ENUM('primary', 'secondary', 'accent', 'background', 'foreground', 'neutral', 'custom');--> statement-breakpoint
CREATE TYPE "public"."brand_guideline_font_role" AS ENUM('heading', 'body', 'button', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."brand_guideline_screenshot_kind" AS ENUM('desktop_hero', 'desktop_full_page', 'mobile_hero');--> statement-breakpoint
CREATE TYPE "public"."brand_guideline_status" AS ENUM('queued', 'generating', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."brand_guideline_token_type" AS ENUM('spacing', 'radius', 'shadow', 'component', 'unknown');--> statement-breakpoint
CREATE TABLE "brand_guideline_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"guideline_id" text NOT NULL,
	"kind" "brand_guideline_asset_kind" NOT NULL,
	"url" text NOT NULL,
	"storage_key" text,
	"format" text,
	"mime_type" text,
	"width" integer,
	"height" integer,
	"aspect_ratio" real,
	"variant" "brand_guideline_asset_variant" NOT NULL,
	"captured_at" timestamp,
	"metadata" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_guideline_colors" (
	"id" text PRIMARY KEY NOT NULL,
	"guideline_id" text NOT NULL,
	"role" "brand_guideline_color_role" DEFAULT 'custom' NOT NULL,
	"name" text,
	"light_value" text NOT NULL,
	"dark_value" text,
	"usage" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_guideline_fonts" (
	"id" text PRIMARY KEY NOT NULL,
	"guideline_id" text NOT NULL,
	"role" "brand_guideline_font_role" DEFAULT 'unknown' NOT NULL,
	"family" text NOT NULL,
	"weight" text,
	"size" text,
	"line_height" text,
	"source" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_guideline_screenshots" (
	"id" text PRIMARY KEY NOT NULL,
	"guideline_id" text NOT NULL,
	"kind" "brand_guideline_screenshot_kind" NOT NULL,
	"url" text NOT NULL,
	"storage_key" text,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"format" text NOT NULL,
	"full_page" boolean DEFAULT false NOT NULL,
	"captured_at" timestamp,
	"metadata" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_guideline_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"guideline_id" text NOT NULL,
	"type" "brand_guideline_token_type" DEFAULT 'unknown' NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	"source" text,
	"metadata" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_guidelines" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_settings_id" text NOT NULL,
	"status" "brand_guideline_status" DEFAULT 'queued' NOT NULL,
	"context_dev_meta" jsonb,
	"last_generated_at" timestamp,
	"last_generation_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_guideline_assets" ADD CONSTRAINT "brand_guideline_assets_guideline_id_brand_guidelines_id_fk" FOREIGN KEY ("guideline_id") REFERENCES "public"."brand_guidelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_guideline_colors" ADD CONSTRAINT "brand_guideline_colors_guideline_id_brand_guidelines_id_fk" FOREIGN KEY ("guideline_id") REFERENCES "public"."brand_guidelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_guideline_fonts" ADD CONSTRAINT "brand_guideline_fonts_guideline_id_brand_guidelines_id_fk" FOREIGN KEY ("guideline_id") REFERENCES "public"."brand_guidelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_guideline_screenshots" ADD CONSTRAINT "brand_guideline_screenshots_guideline_id_brand_guidelines_id_fk" FOREIGN KEY ("guideline_id") REFERENCES "public"."brand_guidelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_guideline_tokens" ADD CONSTRAINT "brand_guideline_tokens_guideline_id_brand_guidelines_id_fk" FOREIGN KEY ("guideline_id") REFERENCES "public"."brand_guidelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_guidelines" ADD CONSTRAINT "brand_guidelines_brand_settings_id_brand_settings_id_fk" FOREIGN KEY ("brand_settings_id") REFERENCES "public"."brand_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brandGuidelineAssets_guidelineId_idx" ON "brand_guideline_assets" USING btree ("guideline_id");--> statement-breakpoint
CREATE INDEX "brandGuidelineAssets_guideline_kind_idx" ON "brand_guideline_assets" USING btree ("guideline_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "brandGuidelineAssets_guideline_kind_variant_uidx" ON "brand_guideline_assets" USING btree ("guideline_id","kind","variant");--> statement-breakpoint
CREATE INDEX "brandGuidelineColors_guidelineId_idx" ON "brand_guideline_colors" USING btree ("guideline_id");--> statement-breakpoint
CREATE INDEX "brandGuidelineColors_guideline_role_idx" ON "brand_guideline_colors" USING btree ("guideline_id","role");--> statement-breakpoint
CREATE INDEX "brandGuidelineFonts_guidelineId_idx" ON "brand_guideline_fonts" USING btree ("guideline_id");--> statement-breakpoint
CREATE INDEX "brandGuidelineFonts_guideline_role_idx" ON "brand_guideline_fonts" USING btree ("guideline_id","role");--> statement-breakpoint
CREATE INDEX "brandGuidelineScreenshots_guidelineId_idx" ON "brand_guideline_screenshots" USING btree ("guideline_id");--> statement-breakpoint
CREATE UNIQUE INDEX "brandGuidelineScreenshots_guideline_kind_uidx" ON "brand_guideline_screenshots" USING btree ("guideline_id","kind");--> statement-breakpoint
CREATE INDEX "brandGuidelineTokens_guidelineId_idx" ON "brand_guideline_tokens" USING btree ("guideline_id");--> statement-breakpoint
CREATE INDEX "brandGuidelineTokens_guideline_type_idx" ON "brand_guideline_tokens" USING btree ("guideline_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "brandGuidelines_brandSettingsId_uidx" ON "brand_guidelines" USING btree ("brand_settings_id");--> statement-breakpoint
CREATE INDEX "brandGuidelines_status_idx" ON "brand_guidelines" USING btree ("status");