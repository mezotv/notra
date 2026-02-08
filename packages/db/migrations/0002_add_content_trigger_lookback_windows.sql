DO $$ BEGIN
 CREATE TYPE "public"."lookback_window" AS ENUM('current_day', 'yesterday', 'last_7_days', 'last_14_days', 'last_30_days');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_trigger_lookback_windows" (
	"trigger_id" text PRIMARY KEY NOT NULL,
	"window" "lookback_window" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_trigger_lookback_windows" ADD CONSTRAINT "content_trigger_lookback_windows_trigger_id_content_triggers_id_fk" FOREIGN KEY ("trigger_id") REFERENCES "public"."content_triggers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "content_trigger_lookback_windows" ("trigger_id", "window")
SELECT ct."id", 'last_7_days'
FROM "content_triggers" ct
WHERE ct."source_type" = 'cron'
ON CONFLICT ("trigger_id") DO NOTHING;
