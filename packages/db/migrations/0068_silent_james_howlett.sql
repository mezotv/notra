CREATE TABLE "agent_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text,
	"source" text DEFAULT 'api' NOT NULL,
	"kind" text DEFAULT 'other' NOT NULL,
	"sentiment" text,
	"status" text DEFAULT 'new' NOT NULL,
	"title" text,
	"message" text NOT NULL,
	"agent_client" text,
	"agent_model" text,
	"tool_version" text,
	"user_agent" text,
	"context_url" text,
	"external_id" text,
	"idempotency_key" text,
	"metadata" jsonb,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "feedback_ingest_token_generation" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agentFeedback_organizationId_createdAt_idx" ON "agent_feedback" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "agentFeedback_organizationId_status_idx" ON "agent_feedback" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "agentFeedback_projectId_idx" ON "agent_feedback" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agentFeedback_organizationId_idempotencyKey_uidx" ON "agent_feedback" USING btree ("organization_id","idempotency_key");