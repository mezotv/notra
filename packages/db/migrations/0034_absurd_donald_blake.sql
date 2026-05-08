ALTER TABLE "organization_notification_settings" ADD COLUMN "marketing_emails" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
INSERT INTO "organization_notification_settings" (
	"id",
	"organization_id",
	"marketing_emails"
)
SELECT
	concat("id", ':notification-settings'),
	"id",
	true
FROM "organizations"
ON CONFLICT ("organization_id") DO UPDATE
SET
	"marketing_emails" = true,
	"updated_at" = now();
