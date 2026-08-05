CREATE TABLE "geo_competitors" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"synonyms" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"kind" text DEFAULT 'direct' NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"prompt" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"company_name" text NOT NULL,
	"aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"competitors" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"languages" text[],
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "geo_competitors" ADD CONSTRAINT "geo_competitors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_prompts" ADD CONSTRAINT "geo_prompts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_settings" ADD CONSTRAINT "geo_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geoCompetitors_organizationId_idx" ON "geo_competitors" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "geoCompetitors_organizationId_name_uidx" ON "geo_competitors" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "geoPrompts_organizationId_idx" ON "geo_prompts" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "geoSettings_organizationId_uidx" ON "geo_settings" USING btree ("organization_id");