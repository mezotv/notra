ALTER TABLE "connected_social_accounts" ADD COLUMN IF NOT EXISTS "verified_type" text;--> statement-breakpoint
ALTER TABLE "connected_social_accounts" DROP COLUMN IF EXISTS "access_token";--> statement-breakpoint
ALTER TABLE "connected_social_accounts" DROP COLUMN IF EXISTS "refresh_token";--> statement-breakpoint
ALTER TABLE "connected_social_accounts" DROP COLUMN IF EXISTS "scope";--> statement-breakpoint
ALTER TABLE "connected_social_accounts" DROP COLUMN IF EXISTS "token_expires_at";