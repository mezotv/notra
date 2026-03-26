CREATE TYPE "public"."applicable_platform" AS ENUM('all', 'twitter', 'linkedin', 'blog');--> statement-breakpoint
CREATE TYPE "public"."reference_type" AS ENUM('twitter_post', 'linkedin_post', 'blog_post', 'custom');--> statement-breakpoint
ALTER TABLE "brand_references" ALTER COLUMN "type" SET DATA TYPE "public"."reference_type" USING "type"::"public"."reference_type";--> statement-breakpoint
ALTER TABLE "brand_references" DROP COLUMN IF EXISTS "applicable_to";--> statement-breakpoint
ALTER TABLE "brand_references" ADD COLUMN "applicable_to" "applicable_platform"[] DEFAULT ARRAY['all']::applicable_platform[] NOT NULL;--> statement-breakpoint
ALTER TABLE "connected_social_accounts" DROP COLUMN IF EXISTS "verified";
