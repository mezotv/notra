UPDATE "brand_settings"
SET "custom_tone" = COALESCE(NULLIF(TRIM("custom_tone"), ''), "tone_profile"),
    "tone_profile" = NULL
WHERE "tone_profile" IS NOT NULL
  AND "tone_profile" NOT IN ('Conversational', 'Professional', 'Casual', 'Formal');--> statement-breakpoint
ALTER TABLE "brand_settings" ADD CONSTRAINT "brandSettings_toneProfile_check" CHECK ("brand_settings"."tone_profile" IS NULL OR "brand_settings"."tone_profile" IN ('Conversational', 'Professional', 'Casual', 'Formal'));
