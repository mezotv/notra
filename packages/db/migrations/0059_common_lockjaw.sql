CREATE TYPE "public"."post_approval_request_status" AS ENUM('pending', 'approved', 'rejected', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."post_review_decision" AS ENUM('approved', 'changes_requested');--> statement-breakpoint
ALTER TYPE "public"."post_status" ADD VALUE 'in_review' BEFORE 'published';--> statement-breakpoint
ALTER TYPE "public"."post_status" ADD VALUE 'approved' BEFORE 'published';--> statement-breakpoint
CREATE TABLE "access_group_members" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"access_group_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "access_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"scopes" jsonb NOT NULL,
	"system_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_workflow_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"step_order" integer NOT NULL,
	"reviewer_access_group_id" text NOT NULL,
	"required_approvals" integer DEFAULT 1 NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_workflows" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"applies_to_access_group_id" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_approval_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"workflow_id" text,
	"steps" jsonb NOT NULL,
	"current_step_order" integer DEFAULT 1 NOT NULL,
	"status" "post_approval_request_status" DEFAULT 'pending' NOT NULL,
	"requested_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "post_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"post_id" text NOT NULL,
	"step_order" integer NOT NULL,
	"reviewer_id" text NOT NULL,
	"decision" "post_review_decision" NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "published_by" text;--> statement-breakpoint
ALTER TABLE "access_group_members" ADD CONSTRAINT "access_group_members_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group_members" ADD CONSTRAINT "access_group_members_access_group_id_access_groups_id_fk" FOREIGN KEY ("access_group_id") REFERENCES "public"."access_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_groups" ADD CONSTRAINT "access_groups_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflow_steps" ADD CONSTRAINT "approval_workflow_steps_workflow_id_approval_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."approval_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflow_steps" ADD CONSTRAINT "approval_workflow_steps_reviewer_access_group_id_access_groups_id_fk" FOREIGN KEY ("reviewer_access_group_id") REFERENCES "public"."access_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_applies_to_access_group_id_access_groups_id_fk" FOREIGN KEY ("applies_to_access_group_id") REFERENCES "public"."access_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_approval_requests" ADD CONSTRAINT "post_approval_requests_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_approval_requests" ADD CONSTRAINT "post_approval_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_approval_requests" ADD CONSTRAINT "post_approval_requests_workflow_id_approval_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."approval_workflows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_approval_requests" ADD CONSTRAINT "post_approval_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reviews" ADD CONSTRAINT "post_reviews_request_id_post_approval_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."post_approval_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reviews" ADD CONSTRAINT "post_reviews_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reviews" ADD CONSTRAINT "post_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "access_group_members_member_group_uidx" ON "access_group_members" USING btree ("member_id","access_group_id");--> statement-breakpoint
CREATE INDEX "access_group_members_groupId_idx" ON "access_group_members" USING btree ("access_group_id");--> statement-breakpoint
CREATE INDEX "access_groups_organizationId_idx" ON "access_groups" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "access_groups_org_name_uidx" ON "access_groups" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "access_groups_org_system_key_uidx" ON "access_groups" USING btree ("organization_id","system_key") WHERE "access_groups"."system_key" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "approval_workflow_steps_workflow_order_uidx" ON "approval_workflow_steps" USING btree ("workflow_id","step_order");--> statement-breakpoint
CREATE INDEX "approval_workflows_organizationId_idx" ON "approval_workflows" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "approval_workflows_org_group_uidx" ON "approval_workflows" USING btree ("organization_id","applies_to_access_group_id") WHERE "approval_workflows"."applies_to_access_group_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "approval_workflows_org_default_uidx" ON "approval_workflows" USING btree ("organization_id") WHERE "approval_workflows"."is_default" = true;--> statement-breakpoint
CREATE INDEX "post_approval_requests_postId_idx" ON "post_approval_requests" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_approval_requests_organizationId_idx" ON "post_approval_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_approval_requests_post_pending_uidx" ON "post_approval_requests" USING btree ("post_id") WHERE "post_approval_requests"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "post_reviews_requestId_idx" ON "post_reviews" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "post_reviews_postId_idx" ON "post_reviews" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_reviews_request_step_reviewer_uidx" ON "post_reviews" USING btree ("request_id","step_order","reviewer_id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;