ALTER TABLE "posts" ALTER COLUMN "markdown" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "raw_html" text;--> statement-breakpoint
UPDATE "posts"
SET "raw_html" = COALESCE(
	"raw_html",
	"source_metadata" #>> '{artifacts,html}',
	CASE
		WHEN "content_type" = 'image' AND "content" LIKE '<%' THEN "content"
		ELSE NULL
	END
)
WHERE "content_type" = 'image' AND "raw_html" IS NULL;
