DROP INDEX "autonomyActions_capabilityName_idempotencyKey_uidx";--> statement-breakpoint
DROP INDEX "autonomyOutbox_destination_dedupeKey_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX "autonomyActions_org_capability_idempotency_uidx" ON "autonomy_actions" USING btree ("organization_id","capability_name","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "autonomyOutbox_org_destination_dedupeKey_uidx" ON "autonomy_outbox" USING btree ("organization_id","destination","dedupe_key");