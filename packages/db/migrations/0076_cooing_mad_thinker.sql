ALTER TABLE "posts" ADD COLUMN "content_subtype" text;--> statement-breakpoint
UPDATE "posts" AS p
SET "content_subtype" = b."brief"->>'contentType'
FROM "geo_content_briefs" AS b
WHERE b."post_id" = p."id"
  AND p."content_subtype" IS NULL
  AND b."brief"->>'contentType' IN ('guide', 'comparison', 'listicle', 'how-to', 'faq', 'alternatives');--> statement-breakpoint
UPDATE "geo_content_briefs"
SET "brief" = ("brief" - 'contentType') || jsonb_build_object('contentSubtype', "brief"->'contentType')
WHERE "brief" ? 'contentType' AND NOT ("brief" ? 'contentSubtype');
