CREATE TABLE "marketplace_brands" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"company_name" text NOT NULL,
	"company_description" text,
	"website_url" text NOT NULL,
	"logo_url" text,
	"accent_color" text,
	"tone_profile" text,
	"custom_tone" text,
	"audience" text,
	"language" text DEFAULT 'English',
	"custom_instructions" text,
	"category" text NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "marketplaceBrands_slug_uidx" ON "marketplace_brands" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "marketplaceBrands_category_idx" ON "marketplace_brands" USING btree ("category");