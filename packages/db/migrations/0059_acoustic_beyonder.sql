CREATE TYPE "public"."persona_social_platform" AS ENUM('twitter', 'linkedin', 'github', 'instagram', 'youtube', 'tiktok', 'website');--> statement-breakpoint
CREATE TABLE "persona_references" (
	"id" text PRIMARY KEY NOT NULL,
	"persona_id" text NOT NULL,
	"type" "reference_type" NOT NULL,
	"content" text NOT NULL,
	"source_url" text,
	"metadata" jsonb,
	"note" text,
	"applicable_to" "applicable_platform"[] DEFAULT ARRAY['all']::applicable_platform[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persona_socials" (
	"id" text PRIMARY KEY NOT NULL,
	"persona_id" text NOT NULL,
	"platform" "persona_social_platform" NOT NULL,
	"username" text NOT NULL,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" text,
	"name" text NOT NULL,
	"title" text,
	"bio" text,
	"avatar_url" text,
	"custom_instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "persona_references" ADD CONSTRAINT "persona_references_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_socials" ADD CONSTRAINT "persona_socials_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "personaReferences_personaId_idx" ON "persona_references" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "personaSocials_personaId_idx" ON "persona_socials" USING btree ("persona_id");--> statement-breakpoint
CREATE UNIQUE INDEX "personaSocials_persona_platform_uidx" ON "persona_socials" USING btree ("persona_id","platform");--> statement-breakpoint
CREATE INDEX "personas_organizationId_idx" ON "personas" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "personas_org_name_uidx" ON "personas" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "personas_memberId_uidx" ON "personas" USING btree ("member_id") WHERE "personas"."member_id" IS NOT NULL;