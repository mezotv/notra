CREATE TABLE "geo_mention_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"scan_id" text NOT NULL,
	"engine" text NOT NULL,
	"prompt_id" text NOT NULL,
	"sequence_id" text,
	"turn" integer DEFAULT 0 NOT NULL,
	"prompt" text NOT NULL,
	"answer" text NOT NULL,
	"mentioned" boolean NOT NULL,
	"position" integer,
	"sentiment" text,
	"competitors" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"language" text DEFAULT 'English' NOT NULL,
	"captured_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_scans" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_sample" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "geo_mention_checks" ADD CONSTRAINT "geo_mention_checks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_mention_checks" ADD CONSTRAINT "geo_mention_checks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_mention_checks" ADD CONSTRAINT "geo_mention_checks_scan_id_geo_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."geo_scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_scans" ADD CONSTRAINT "geo_scans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_scans" ADD CONSTRAINT "geo_scans_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geoMentionChecks_organizationId_capturedAt_idx" ON "geo_mention_checks" USING btree ("organization_id","captured_at");--> statement-breakpoint
CREATE INDEX "geoMentionChecks_projectId_capturedAt_idx" ON "geo_mention_checks" USING btree ("project_id","captured_at");--> statement-breakpoint
CREATE INDEX "geoMentionChecks_projectEnginePrompt_idx" ON "geo_mention_checks" USING btree ("project_id","engine","prompt_id","captured_at");--> statement-breakpoint
CREATE INDEX "geoMentionChecks_scanId_idx" ON "geo_mention_checks" USING btree ("scan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "geoMentionChecks_scanEnginePromptTurnLanguage_uidx" ON "geo_mention_checks" USING btree ("scan_id","engine","prompt_id","turn","language");--> statement-breakpoint
CREATE INDEX "geoScans_organizationId_idx" ON "geo_scans" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "geoScans_projectId_startedAt_idx" ON "geo_scans" USING btree ("project_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_organizationId_sample_uidx" ON "projects" USING btree ("organization_id") WHERE "projects"."is_sample" = true;