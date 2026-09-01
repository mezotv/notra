ALTER TABLE "geo_settings" ADD COLUMN "next_scan_at" timestamp;--> statement-breakpoint
ALTER TABLE "geo_settings" DROP COLUMN "qstash_message_id";