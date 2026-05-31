CREATE TYPE "public"."post_collection_name_source" AS ENUM('generated', 'user', 'backfill');--> statement-breakpoint
CREATE TYPE "public"."post_collection_source" AS ENUM('manual', 'chat', 'schedule', 'automation', 'api', 'backfill');--> statement-breakpoint
CREATE TABLE "post_collections" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"source" "post_collection_source" NOT NULL,
	"source_id" text,
	"name" text NOT NULL,
	"name_source" "post_collection_name_source" DEFAULT 'generated' NOT NULL,
	"content_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_metadata" jsonb,
	"expected_post_count" integer,
	"completed_post_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_collections" ADD CONSTRAINT "post_collections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "collection_id" text;--> statement-breakpoint
INSERT INTO "post_collections" (
	"id",
	"organization_id",
	"source",
	"source_id",
	"name",
	"name_source",
	"content_types",
	"source_metadata",
	"expected_post_count",
	"completed_post_count",
	"created_at",
	"updated_at"
)
SELECT
	'backfill_' || "posts"."id",
	"posts"."organization_id",
	'backfill',
	"posts"."id",
	(
		CASE "posts"."content_type"
			WHEN 'blog_post' THEN 'Blog post'
			WHEN 'changelog' THEN 'Changelog'
			WHEN 'linkedin_post' THEN 'LinkedIn post'
			WHEN 'twitter_post' THEN 'Twitter post'
			WHEN 'investor_update' THEN 'Investor update'
			ELSE initcap(replace("posts"."content_type", '_', ' '))
		END
		|| ' - '
		|| to_char("posts"."created_at", 'FMMonth')
		|| ' '
		|| extract(day from "posts"."created_at")::int
		|| CASE
			WHEN extract(day from "posts"."created_at")::int IN (11, 12, 13) THEN 'th'
			WHEN extract(day from "posts"."created_at")::int % 10 = 1 THEN 'st'
			WHEN extract(day from "posts"."created_at")::int % 10 = 2 THEN 'nd'
			WHEN extract(day from "posts"."created_at")::int % 10 = 3 THEN 'rd'
			ELSE 'th'
		END
		|| ' '
		|| extract(year from "posts"."created_at")::int
	),
	'backfill',
	jsonb_build_array("posts"."content_type"),
	"posts"."source_metadata",
	1,
	1,
	"posts"."created_at",
	"posts"."updated_at"
FROM "posts";--> statement-breakpoint
UPDATE "posts" SET "collection_id" = 'backfill_' || "id";--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "collection_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "post_collections_org_created_at_idx" ON "post_collections" USING btree ("organization_id","created_at","id");--> statement-breakpoint
CREATE INDEX "post_collections_source_idx" ON "post_collections" USING btree ("organization_id","source","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_collections_chat_source_uidx" ON "post_collections" USING btree ("organization_id","source","source_id") WHERE "post_collections"."source" = 'chat' AND "post_collections"."source_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_collection_id_post_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."post_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posts_collection_id_idx" ON "posts" USING btree ("collection_id");
