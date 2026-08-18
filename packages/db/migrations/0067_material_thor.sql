ALTER TABLE "google_search_console_integrations" DROP CONSTRAINT "google_search_console_integrations_created_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "google_search_console_integrations" ALTER COLUMN "created_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "google_search_console_integrations" ADD CONSTRAINT "google_search_console_integrations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;