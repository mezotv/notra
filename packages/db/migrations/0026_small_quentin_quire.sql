ALTER TABLE "organization_notification_settings" ALTER COLUMN "scheduled_content_failed" SET DEFAULT true;
--> statement-breakpoint
INSERT INTO "organization_notification_settings" (
	"id",
	"organization_id",
	"scheduled_content_failed"
)
SELECT
	concat("id", ':notification-settings'),
	"id",
	true
FROM "organizations"
ON CONFLICT ("organization_id") DO UPDATE
SET
	"scheduled_content_failed" = true,
	"updated_at" = now();
