CREATE TABLE "geo_agent_readiness_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"target_url" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"score" real,
	"score_label" text,
	"score_breakdown" jsonb DEFAULT 'null'::jsonb,
	"issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"eligible_checks" integer,
	"report_url" text,
	"error_message" text,
	"scanned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "geo_agent_readiness_reports" ADD CONSTRAINT "geo_agent_readiness_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geo_agent_readiness_reports" ADD CONSTRAINT "geo_agent_readiness_reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geoAgentReadinessReports_organizationId_idx" ON "geo_agent_readiness_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "geoAgentReadinessReports_projectId_createdAt_idx" ON "geo_agent_readiness_reports" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "geoAgentReadinessReports_projectId_running_uidx" ON "geo_agent_readiness_reports" USING btree ("project_id") WHERE "geo_agent_readiness_reports"."status" = 'running';
