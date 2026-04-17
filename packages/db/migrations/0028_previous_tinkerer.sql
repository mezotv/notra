ALTER TABLE "users" ADD COLUMN "hide_personal_data" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "show_agent_stats" boolean DEFAULT false NOT NULL;