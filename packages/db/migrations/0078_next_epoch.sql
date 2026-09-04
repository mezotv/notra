ALTER TABLE "geo_content_briefs" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD COLUMN "rescan_scan_id" text;--> statement-breakpoint
ALTER TABLE "geo_content_briefs" ADD COLUMN "rescan_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "geo_prompts" ADD COLUMN "tags" text[] DEFAULT ARRAY[]::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "geo_settings" ADD COLUMN "conversion_paths" text[] DEFAULT ARRAY[]::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "geo_settings" ADD COLUMN "paused_auto_prompt_ids" text[] DEFAULT ARRAY[]::text[] NOT NULL;