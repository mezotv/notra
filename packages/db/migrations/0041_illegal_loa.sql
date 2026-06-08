DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "posts"
    WHERE "content_type" = 'image'
      AND "html_url" IS NULL
      AND (
        "raw_html" IS NOT NULL
        OR "source_metadata" #>> '{artifacts,html}' IS NOT NULL
      )
  ) THEN
    RAISE EXCEPTION 'Backfill posts.html_url for generated image posts before applying this migration.';
  END IF;
END $$;--> statement-breakpoint
UPDATE "posts"
SET "source_metadata" = jsonb_set(
  "source_metadata",
  '{artifacts}',
  ("source_metadata"->'artifacts') - 'html' - 'svg' - 'htmlUrl',
  true
)
WHERE "content_type" = 'image'
  AND "source_metadata" ? 'artifacts';--> statement-breakpoint
UPDATE "posts"
SET "source_metadata" = "source_metadata" - 'artifacts'
WHERE "content_type" = 'image'
  AND "source_metadata"->'artifacts' = '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "raw_html";
