ALTER TABLE "brand_references" ADD COLUMN "supermemory_document_id" text;--> statement-breakpoint
ALTER TABLE "brand_references" ADD COLUMN "supermemory_memory_id" text;--> statement-breakpoint
ALTER TABLE "brand_references" ADD COLUMN "supermemory_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "brand_references" ADD COLUMN "supermemory_last_sync_error" text;