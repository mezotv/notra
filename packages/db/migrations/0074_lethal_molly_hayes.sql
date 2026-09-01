ALTER TABLE "geo_mention_checks" ADD COLUMN "finish_reason" text;--> statement-breakpoint
ALTER TABLE "geo_mention_checks" ADD COLUMN "prompt_tokens" integer;--> statement-breakpoint
ALTER TABLE "geo_mention_checks" ADD COLUMN "output_tokens" integer;--> statement-breakpoint
ALTER TABLE "geo_mention_checks" ADD COLUMN "reasoning_tokens" integer;
