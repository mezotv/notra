CREATE TABLE "github_title_filters" (
	"id" text PRIMARY KEY NOT NULL,
	"repository_id" text NOT NULL,
	"match_type" text NOT NULL,
	"pattern" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linear_title_filters" (
	"id" text PRIMARY KEY NOT NULL,
	"integration_id" text NOT NULL,
	"match_type" text NOT NULL,
	"pattern" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_title_filters" ADD CONSTRAINT "github_title_filters_repository_id_github_integrations_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."github_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linear_title_filters" ADD CONSTRAINT "linear_title_filters_integration_id_linear_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."linear_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "githubTitleFilters_repositoryId_idx" ON "github_title_filters" USING btree ("repository_id");--> statement-breakpoint
CREATE UNIQUE INDEX "githubTitleFilters_repository_matchType_pattern_uidx" ON "github_title_filters" USING btree ("repository_id","match_type","pattern");--> statement-breakpoint
CREATE INDEX "linearTitleFilters_integrationId_idx" ON "linear_title_filters" USING btree ("integration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "linearTitleFilters_integration_matchType_pattern_uidx" ON "linear_title_filters" USING btree ("integration_id","match_type","pattern");