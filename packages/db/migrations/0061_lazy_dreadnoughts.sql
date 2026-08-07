CREATE TYPE "public"."autonomy_action_status" AS ENUM('pending', 'executing', 'succeeded', 'failed', 'unknown', 'compensated', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."autonomy_goal_status" AS ENUM('open', 'in_progress', 'blocked', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."autonomy_mandate_status" AS ENUM('active', 'paused', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."autonomy_outbox_status" AS ENUM('pending', 'attempting', 'delivered', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."autonomy_run_status" AS ENUM('planning', 'executing', 'completed', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."autonomy_run_trigger" AS ENUM('signal', 'wake', 'manual', 'repair');--> statement-breakpoint
CREATE TYPE "public"."autonomy_signal_status" AS ENUM('pending', 'coalesced', 'processed', 'discarded');--> statement-breakpoint
CREATE TYPE "public"."autonomy_task_status" AS ENUM('pending', 'ready', 'running', 'waiting', 'completed', 'failed', 'canceled');--> statement-breakpoint
CREATE TABLE "autonomy_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"run_id" text NOT NULL,
	"task_id" text,
	"capability_name" text NOT NULL,
	"capability_version" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" "autonomy_action_status" DEFAULT 'pending' NOT NULL,
	"external_ref" jsonb,
	"error" jsonb,
	"started_at" timestamp,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autonomy_checkpoints" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"run_id" text NOT NULL,
	"task_id" text,
	"kind" text NOT NULL,
	"state" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autonomy_claims" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"scope" text NOT NULL,
	"claim_key" text NOT NULL,
	"owner_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autonomy_controller_leases" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"owner_token" text NOT NULL,
	"fencing_token" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autonomy_goals" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"mandate_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"status" "autonomy_goal_status" DEFAULT 'open' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"origin_signal_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autonomy_mandates" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"objective" text NOT NULL,
	"policy" jsonb NOT NULL,
	"status" "autonomy_mandate_status" DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"qstash_schedule_id" text,
	"created_by_user_id" text,
	"paused_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autonomy_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"run_id" text,
	"destination" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "autonomy_outbox_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp,
	"last_error" text,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autonomy_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"mandate_id" text NOT NULL,
	"mandate_version" integer NOT NULL,
	"goal_id" text,
	"trigger" "autonomy_run_trigger" NOT NULL,
	"planner_input_hash" text,
	"planner_output" jsonb,
	"status" "autonomy_run_status" DEFAULT 'planning' NOT NULL,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autonomy_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"source" text NOT NULL,
	"source_event_id" text,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"dedupe_hash" text NOT NULL,
	"status" "autonomy_signal_status" DEFAULT 'pending' NOT NULL,
	"coalesced_into_signal_id" text,
	"occurred_at" timestamp NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autonomy_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"goal_id" text NOT NULL,
	"run_id" text,
	"capability_name" text NOT NULL,
	"capability_version" integer DEFAULT 1 NOT NULL,
	"params" jsonb NOT NULL,
	"depends_on_task_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "autonomy_task_status" DEFAULT 'pending' NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"wait_until" timestamp,
	"result" jsonb,
	"error_message" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "autonomy_actions" ADD CONSTRAINT "autonomy_actions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_actions" ADD CONSTRAINT "autonomy_actions_run_id_autonomy_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."autonomy_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_actions" ADD CONSTRAINT "autonomy_actions_task_id_autonomy_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."autonomy_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_checkpoints" ADD CONSTRAINT "autonomy_checkpoints_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_checkpoints" ADD CONSTRAINT "autonomy_checkpoints_run_id_autonomy_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."autonomy_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_checkpoints" ADD CONSTRAINT "autonomy_checkpoints_task_id_autonomy_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."autonomy_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_claims" ADD CONSTRAINT "autonomy_claims_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_controller_leases" ADD CONSTRAINT "autonomy_controller_leases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_goals" ADD CONSTRAINT "autonomy_goals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_goals" ADD CONSTRAINT "autonomy_goals_mandate_id_autonomy_mandates_id_fk" FOREIGN KEY ("mandate_id") REFERENCES "public"."autonomy_mandates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_mandates" ADD CONSTRAINT "autonomy_mandates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_mandates" ADD CONSTRAINT "autonomy_mandates_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_outbox" ADD CONSTRAINT "autonomy_outbox_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_outbox" ADD CONSTRAINT "autonomy_outbox_run_id_autonomy_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."autonomy_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_runs" ADD CONSTRAINT "autonomy_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_runs" ADD CONSTRAINT "autonomy_runs_mandate_id_autonomy_mandates_id_fk" FOREIGN KEY ("mandate_id") REFERENCES "public"."autonomy_mandates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_runs" ADD CONSTRAINT "autonomy_runs_goal_id_autonomy_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."autonomy_goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_signals" ADD CONSTRAINT "autonomy_signals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_signals" ADD CONSTRAINT "autonomySignals_coalescedIntoSignalId_fk" FOREIGN KEY ("coalesced_into_signal_id") REFERENCES "public"."autonomy_signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_tasks" ADD CONSTRAINT "autonomy_tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_tasks" ADD CONSTRAINT "autonomy_tasks_goal_id_autonomy_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."autonomy_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_tasks" ADD CONSTRAINT "autonomy_tasks_run_id_autonomy_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."autonomy_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "autonomyActions_organizationId_idx" ON "autonomy_actions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "autonomyActions_runId_idx" ON "autonomy_actions" USING btree ("run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "autonomyActions_org_capability_idempotency_uidx" ON "autonomy_actions" USING btree ("organization_id","capability_name","idempotency_key");--> statement-breakpoint
CREATE INDEX "autonomyActions_organizationId_status_idx" ON "autonomy_actions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "autonomyCheckpoints_organizationId_idx" ON "autonomy_checkpoints" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "autonomyCheckpoints_runId_idx" ON "autonomy_checkpoints" USING btree ("run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "autonomyClaims_scope_claimKey_uidx" ON "autonomy_claims" USING btree ("scope","claim_key");--> statement-breakpoint
CREATE INDEX "autonomyClaims_expiresAt_idx" ON "autonomy_claims" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "autonomyControllerLeases_organizationId_idx" ON "autonomy_controller_leases" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "autonomyGoals_organizationId_idx" ON "autonomy_goals" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "autonomyGoals_mandateId_idx" ON "autonomy_goals" USING btree ("mandate_id");--> statement-breakpoint
CREATE INDEX "autonomyGoals_organizationId_status_idx" ON "autonomy_goals" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "autonomyMandates_organizationId_idx" ON "autonomy_mandates" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "autonomyMandates_organizationId_name_uidx" ON "autonomy_mandates" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "autonomyOutbox_organizationId_idx" ON "autonomy_outbox" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "autonomyOutbox_org_destination_dedupeKey_uidx" ON "autonomy_outbox" USING btree ("organization_id","destination","dedupe_key");--> statement-breakpoint
CREATE INDEX "autonomyOutbox_status_nextAttemptAt_idx" ON "autonomy_outbox" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "autonomyRuns_organizationId_idx" ON "autonomy_runs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "autonomyRuns_mandateId_idx" ON "autonomy_runs" USING btree ("mandate_id");--> statement-breakpoint
CREATE INDEX "autonomyRuns_goalId_idx" ON "autonomy_runs" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "autonomyRuns_organizationId_status_idx" ON "autonomy_runs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "autonomySignals_organizationId_idx" ON "autonomy_signals" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "autonomySignals_organizationId_dedupeHash_uidx" ON "autonomy_signals" USING btree ("organization_id","dedupe_hash");--> statement-breakpoint
CREATE INDEX "autonomySignals_organizationId_status_occurredAt_idx" ON "autonomy_signals" USING btree ("organization_id","status","occurred_at");--> statement-breakpoint
CREATE INDEX "autonomyTasks_organizationId_idx" ON "autonomy_tasks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "autonomyTasks_goalId_idx" ON "autonomy_tasks" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "autonomyTasks_runId_idx" ON "autonomy_tasks" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "autonomyTasks_organizationId_status_waitUntil_idx" ON "autonomy_tasks" USING btree ("organization_id","status","wait_until");