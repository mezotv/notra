CREATE TABLE "brand_references" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_settings_id" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_references" ADD CONSTRAINT "brand_references_brand_settings_id_brand_settings_id_fk" FOREIGN KEY ("brand_settings_id") REFERENCES "public"."brand_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brandReferences_brandSettingsId_idx" ON "brand_references" USING btree ("brand_settings_id");