ALTER TABLE "organizations" ADD COLUMN "social_connect_profile_id" text;--> statement-breakpoint
ALTER TABLE "connected_social_accounts" DROP COLUMN "access_token";--> statement-breakpoint
ALTER TABLE "connected_social_accounts" DROP COLUMN "refresh_token";--> statement-breakpoint
ALTER TABLE "connected_social_accounts" DROP COLUMN "scope";--> statement-breakpoint
ALTER TABLE "connected_social_accounts" DROP COLUMN "token_expires_at";