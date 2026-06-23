CREATE TYPE "public"."brand_sitemap_page_category" AS ENUM('crawled', 'redirect', 'queued', 'failed');--> statement-breakpoint
CREATE TYPE "public"."brand_sitemap_status" AS ENUM('queued', 'crawling', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "brand_sitemap_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"sitemap_id" text NOT NULL,
	"url" text NOT NULL,
	"path" text NOT NULL,
	"title" text,
	"category" "brand_sitemap_page_category" NOT NULL,
	"status_code" integer,
	"redirect_target" text,
	"word_count" integer,
	"text_ratio" real,
	"internal_links" integer,
	"external_links" integer,
	"crawled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_sitemaps" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_settings_id" text NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"hostname" text NOT NULL,
	"status" "brand_sitemap_status" DEFAULT 'queued' NOT NULL,
	"total_pages" integer DEFAULT 0 NOT NULL,
	"indexed_pages" integer DEFAULT 0 NOT NULL,
	"failed_pages" integer DEFAULT 0 NOT NULL,
	"context_dev_meta" jsonb,
	"last_crawl_started_at" timestamp,
	"last_crawled_at" timestamp,
	"last_crawl_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_sitemap_pages" ADD CONSTRAINT "brand_sitemap_pages_sitemap_id_brand_sitemaps_id_fk" FOREIGN KEY ("sitemap_id") REFERENCES "public"."brand_sitemaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_sitemaps" ADD CONSTRAINT "brand_sitemaps_brand_settings_id_brand_settings_id_fk" FOREIGN KEY ("brand_settings_id") REFERENCES "public"."brand_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brandSitemapPages_sitemapId_idx" ON "brand_sitemap_pages" USING btree ("sitemap_id");--> statement-breakpoint
CREATE INDEX "brandSitemapPages_sitemap_category_idx" ON "brand_sitemap_pages" USING btree ("sitemap_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "brandSitemapPages_sitemap_url_uidx" ON "brand_sitemap_pages" USING btree ("sitemap_id","url");--> statement-breakpoint
CREATE INDEX "brandSitemaps_brandSettingsId_idx" ON "brand_sitemaps" USING btree ("brand_settings_id");--> statement-breakpoint
CREATE UNIQUE INDEX "brandSitemaps_brandSettings_url_uidx" ON "brand_sitemaps" USING btree ("brand_settings_id","url");