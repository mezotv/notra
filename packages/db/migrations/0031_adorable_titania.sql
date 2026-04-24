DROP INDEX "chatAttachments_userId_createdAt_idx";--> statement-breakpoint
ALTER TABLE "chat_attachments" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chatAttachments_organizationId_createdAt_idx" ON "chat_attachments" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "chatAttachments_userId_idx" ON "chat_attachments" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "chat_attachment_retention_days";