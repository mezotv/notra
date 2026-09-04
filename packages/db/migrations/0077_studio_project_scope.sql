ALTER TABLE "chat_sessions" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "post_collections" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_collections" ADD CONSTRAINT "post_collections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chatSessions_org_project_idx" ON "chat_sessions" USING btree ("project_id","organization_id");--> statement-breakpoint
CREATE INDEX "post_collections_org_project_idx" ON "post_collections" USING btree ("project_id","organization_id");--> statement-breakpoint
UPDATE "post_collections" AS pc
SET "project_id" = p."id"
FROM "projects" AS p
WHERE pc."project_id" IS NULL
  AND jsonb_typeof(pc."source_metadata") = 'object'
  AND p."id" = pc."source_metadata"->>'projectId'
  AND p."organization_id" = pc."organization_id";--> statement-breakpoint
UPDATE "post_collections" AS pc
SET "project_id" = (
  SELECT p."id"
  FROM "projects" AS p
  WHERE p."organization_id" = pc."organization_id"
    AND p."brand_settings_id" = pc."source_metadata"->>'brandVoiceId'
  ORDER BY p."is_sample" ASC, p."created_at" ASC, p."id" ASC
  LIMIT 1
)
WHERE pc."project_id" IS NULL
  AND jsonb_typeof(pc."source_metadata") = 'object'
  AND EXISTS (
    SELECT 1
    FROM "projects" AS p
    WHERE p."organization_id" = pc."organization_id"
      AND p."brand_settings_id" = pc."source_metadata"->>'brandVoiceId'
  );--> statement-breakpoint
UPDATE "post_collections" AS pc
SET "project_id" = m."project_id"
FROM (
  SELECT DISTINCT ON (po."collection_id")
    po."collection_id" AS "collection_id",
    p."id" AS "project_id"
  FROM "posts" AS po
  INNER JOIN "post_collections" AS c ON c."id" = po."collection_id"
  INNER JOIN "projects" AS p
    ON p."organization_id" = c."organization_id"
    AND p."brand_settings_id" = po."source_metadata"->>'brandVoiceId'
  WHERE c."project_id" IS NULL
    AND jsonb_typeof(po."source_metadata") = 'object'
  ORDER BY po."collection_id", p."is_sample" ASC, p."created_at" ASC, p."id" ASC
) AS m
WHERE pc."project_id" IS NULL
  AND pc."id" = m."collection_id";--> statement-breakpoint
UPDATE "post_collections" AS pc
SET "project_id" = (
  SELECT p."id"
  FROM "projects" AS p
  WHERE p."organization_id" = pc."organization_id"
  ORDER BY p."is_sample" ASC, p."created_at" ASC, p."id" ASC
  LIMIT 1
)
WHERE pc."project_id" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "projects" AS p
    WHERE p."organization_id" = pc."organization_id"
  );--> statement-breakpoint
UPDATE "chat_sessions" AS cs
SET "project_id" = pc."project_id"
FROM "posts" AS po
INNER JOIN "post_collections" AS pc ON pc."id" = po."collection_id"
WHERE cs."project_id" IS NULL
  AND cs."content_id" = po."id"
  AND pc."project_id" IS NOT NULL
  AND pc."organization_id" = cs."organization_id";--> statement-breakpoint
UPDATE "chat_sessions" AS cs
SET "project_id" = (
  SELECT p."id"
  FROM "projects" AS p
  WHERE p."organization_id" = cs."organization_id"
  ORDER BY p."is_sample" ASC, p."created_at" ASC, p."id" ASC
  LIMIT 1
)
WHERE cs."project_id" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "projects" AS p
    WHERE p."organization_id" = cs."organization_id"
  );
