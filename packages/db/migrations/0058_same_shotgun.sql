CREATE TABLE "agent_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"chat_id" text,
	"surface" text NOT NULL,
	"content_id" text,
	"collection_id" text,
	"eve_session_id" text NOT NULL,
	"continuation_token" text NOT NULL,
	"stream_index" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_chat_id_chat_sessions_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agentSessions_eveSessionId_uidx" ON "agent_sessions" USING btree ("eve_session_id");--> statement-breakpoint
CREATE INDEX "agentSessions_organizationId_idx" ON "agent_sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "agentSessions_chatId_idx" ON "agent_sessions" USING btree ("chat_id");