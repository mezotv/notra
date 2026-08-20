CREATE TABLE "social_experiments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"hypothesis" text,
	"provider" text NOT NULL,
	"variant_a_post_id" text NOT NULL,
	"variant_b_post_id" text NOT NULL,
	"metric" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"winner" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_experiments" ADD CONSTRAINT "social_experiments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "socialExperiments_organizationId_idx" ON "social_experiments" USING btree ("organization_id");