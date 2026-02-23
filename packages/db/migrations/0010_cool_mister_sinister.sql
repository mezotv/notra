CREATE TYPE "public"."post_status" AS ENUM('draft', 'published');--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "status" "post_status" DEFAULT 'draft' NOT NULL;