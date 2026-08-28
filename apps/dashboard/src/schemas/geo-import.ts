import { array, boolean, enum as enumType, object, string } from "zod";

import {
  GEO_COMPETITOR_MAX_SYNONYMS,
  GEO_DOMAIN_REGEX,
  GEO_PROMPT_MAX_LENGTH,
  GEO_PROMPT_MIN_LENGTH,
  GEO_SHORT_FIELD_MAX_LENGTH,
} from "@/constants/geo";
import { normalizeCompetitorDomain } from "@/lib/geo/domain";

export const geoCompetitorDomainSchema = string()
  .trim()
  .max(GEO_SHORT_FIELD_MAX_LENGTH)
  .transform(normalizeCompetitorDomain)
  .refine((value) => value === null || GEO_DOMAIN_REGEX.test(value), {
    message: "Enter a domain like example.com",
  });

export const geoPromptImportRowSchema = object({
  prompt: string()
    .trim()
    .min(GEO_PROMPT_MIN_LENGTH, {
      message: `Prompt must be at least ${GEO_PROMPT_MIN_LENGTH} characters`,
    })
    .max(GEO_PROMPT_MAX_LENGTH, {
      message: `Prompt must be at most ${GEO_PROMPT_MAX_LENGTH} characters`,
    }),
  enabled: boolean({ message: "Enabled must be true or false" }).optional(),
});

export const geoCompetitorImportRowSchema = object({
  name: string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(GEO_SHORT_FIELD_MAX_LENGTH, {
      message: `Name must be at most ${GEO_SHORT_FIELD_MAX_LENGTH} characters`,
    }),
  domain: geoCompetitorDomainSchema.nullable().optional(),
  kind: enumType(["direct", "indirect"], {
    message: "Kind must be direct or indirect",
  }).optional(),
  synonyms: array(
    string()
      .trim()
      .min(1, { message: "Synonyms cannot be empty" })
      .max(GEO_SHORT_FIELD_MAX_LENGTH, {
        message: `Synonyms must be at most ${GEO_SHORT_FIELD_MAX_LENGTH} characters`,
      })
  )
    .max(GEO_COMPETITOR_MAX_SYNONYMS, {
      message: `Use at most ${GEO_COMPETITOR_MAX_SYNONYMS} synonyms`,
    })
    .optional(),
});
