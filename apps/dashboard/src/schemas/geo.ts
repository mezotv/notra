import { SUPPORTED_LANGUAGES } from "@notra/ai/constants/languages";
import { array, boolean, enum as enumType, number, object, string } from "zod";
import {
  GEO_DISCOVERY_MAX_ALIASES,
  GEO_DISCOVERY_MAX_COMPETITORS,
  GEO_DISCOVERY_MAX_PROMPTS,
  GEO_DISCOVERY_MIN_COMPETITORS,
  GEO_DISCOVERY_MIN_PROMPTS,
  GEO_MAX_LANGUAGES,
  GEO_PROMPT_MAX_LENGTH,
  GEO_PROMPT_MIN_LENGTH,
} from "@/constants/geo";
import { normalizeCompetitorDomain } from "@/lib/geo/domain";
import { publicWebsiteUrlSchema } from "@/schemas/url";

const GEO_SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES);
const MAX_ALIASES = 10;
const MAX_COMPETITORS = 10;
const MAX_JUDGE_COMPETITORS = 15;
const MAX_EXCERPT_LENGTH = 300;
const MAX_DAYS = 365;
const MAX_MODEL_USAGE_LIMIT = 50;
const MAX_AI_TRAFFIC_LOG_LIMIT = 200;
const MAX_AI_TRAFFIC_PAGES_LIMIT = 100;
const MAX_AI_TRAFFIC_JOURNEYS_LIMIT = 100;
const MAX_GEO_FIELD_LENGTH = 1024;
const MAX_GEO_SHORT_FIELD_LENGTH = 128;
const MAX_GEO_COMPETITOR_SYNONYMS = 8;
const MAX_GEO_URL_LENGTH = 2048;
const MAX_GEO_METHOD_LENGTH = 16;
const GEO_DOMAIN_REGEX = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const MIN_PROMPT_LENGTH = GEO_PROMPT_MIN_LENGTH;
const MAX_PROMPT_LENGTH = GEO_PROMPT_MAX_LENGTH;

export const geoSettingsUpsertInputSchema = object({
  organizationId: string().min(1),
  companyName: string().min(1),
  aliases: array(string().min(1)).max(MAX_ALIASES),
  competitors: array(string().min(1)).max(MAX_COMPETITORS),
  languages: array(string().min(1))
    .max(GEO_MAX_LANGUAGES)
    .refine(
      (values) =>
        values.every((value) => GEO_SUPPORTED_LANGUAGE_SET.has(value)),
      {
        message: "Unsupported language",
      }
    ),
  enabled: boolean(),
});

export const geoCompetitorDomainSchema = string()
  .trim()
  .max(MAX_GEO_SHORT_FIELD_LENGTH)
  .transform(normalizeCompetitorDomain)
  .refine((value) => value === null || GEO_DOMAIN_REGEX.test(value), {
    message: "Enter a domain like example.com",
  });

export const geoCompetitorUpsertInputSchema = object({
  organizationId: string().min(1),
  name: string().trim().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH),
  domain: geoCompetitorDomainSchema.nullable(),
  synonyms: array(string().trim().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH))
    .max(MAX_GEO_COMPETITOR_SYNONYMS)
    .optional(),
  kind: enumType(["direct", "indirect"]).optional(),
  color: string().trim().max(MAX_GEO_SHORT_FIELD_LENGTH).nullable().optional(),
});

export const geoCompetitorDeleteInputSchema = object({
  organizationId: string().min(1),
  name: string().trim().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH),
});

export const geoCompetitorDetailInputSchema = object({
  organizationId: string().min(1),
  brand: string().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH),
  days: number().int().min(1).max(MAX_DAYS).optional(),
});

export const geoTranslationResultSchema = object({
  translations: array(string().min(1)),
});

export const geoOrganizationInputSchema = object({
  organizationId: string().min(1),
});

export const geoTimeseriesInputSchema = object({
  organizationId: string().min(1),
  days: number().int().min(1).max(MAX_DAYS).optional(),
});

export const geoPromptCreateInputSchema = object({
  organizationId: string().min(1),
  prompt: string().min(MIN_PROMPT_LENGTH).max(MAX_PROMPT_LENGTH),
});

export const geoPromptDeleteInputSchema = object({
  organizationId: string().min(1),
  promptId: string().min(1),
});

export const geoPromptToggleInputSchema = object({
  organizationId: string().min(1),
  promptId: string().min(1),
  enabled: boolean(),
});

export const geoScanPayloadSchema = object({
  organizationId: string().min(1),
});

export const geoGenerateFromWebsiteInputSchema = object({
  organizationId: string().min(1),
  url: publicWebsiteUrlSchema,
});

export const geoWebsiteDiscoverySchema = object({
  companyName: string().min(1),
  aliases: array(string().min(1)).max(GEO_DISCOVERY_MAX_ALIASES),
  competitors: array(
    object({
      name: string().min(1),
      domain: string().nullable(),
    })
  )
    .min(GEO_DISCOVERY_MIN_COMPETITORS)
    .max(GEO_DISCOVERY_MAX_COMPETITORS),
  prompts: array(string().min(MIN_PROMPT_LENGTH).max(MAX_PROMPT_LENGTH))
    .min(GEO_DISCOVERY_MIN_PROMPTS)
    .max(GEO_DISCOVERY_MAX_PROMPTS),
});

export const geoModelUsageInputSchema = object({
  organizationId: string().min(1),
  days: number().int().min(1).max(MAX_DAYS).optional(),
  limit: number().int().min(1).max(MAX_MODEL_USAGE_LIMIT).optional(),
});

export const openRouterRankingsResponseSchema = object({
  meta: object({
    as_of: string().min(1),
    start_date: string().min(1),
    end_date: string().min(1),
  }),
  data: array(
    object({
      date: string().min(1),
      model_permaslug: string().min(1),
      total_tokens: string().min(1),
    })
  ),
});

export const openRouterModelsResponseSchema = object({
  data: array(
    object({
      id: string().min(1),
      canonical_slug: string().min(1).nullable().optional(),
    })
  ),
});

export const geoJudgeResultSchema = object({
  mentioned: boolean(),
  position: number().nullable(),
  sentiment: enumType(["positive", "neutral", "negative"]).nullable(),
  competitors: array(string()).max(MAX_JUDGE_COMPETITORS),
  excerpt: string().max(MAX_EXCERPT_LENGTH),
});

export const aiTrafficInputSchema = object({
  organizationId: string().min(1),
  days: number().int().min(1).max(MAX_DAYS).optional(),
  limit: number().int().min(1).max(MAX_AI_TRAFFIC_LOG_LIMIT).optional(),
});

export const geoTrafficLogInputSchema = object({
  organizationId: string().min(1),
  limit: number().int().min(1).max(MAX_AI_TRAFFIC_LOG_LIMIT).optional(),
  visitorType: enumType(["crawler", "ai_referral", "human"]).optional(),
  category: enumType([
    "training-crawler",
    "search-index",
    "assistant-browse",
  ]).optional(),
});

export const geoRequestPayloadSchema = object({
  timestamp: string().max(MAX_GEO_SHORT_FIELD_LENGTH).optional(),
  method: string().min(1).max(MAX_GEO_METHOD_LENGTH),
  url: string().min(1).max(MAX_GEO_URL_LENGTH),
  ip: string().max(MAX_GEO_SHORT_FIELD_LENGTH).optional(),
  geo: object({
    country: string().max(MAX_GEO_SHORT_FIELD_LENGTH).optional(),
    region: string().max(MAX_GEO_SHORT_FIELD_LENGTH).optional(),
    city: string().max(MAX_GEO_SHORT_FIELD_LENGTH).optional(),
    timezone: string().max(MAX_GEO_SHORT_FIELD_LENGTH).optional(),
    latitude: string().max(MAX_GEO_SHORT_FIELD_LENGTH).optional(),
    longitude: string().max(MAX_GEO_SHORT_FIELD_LENGTH).optional(),
  }).optional(),
  referer: string().max(MAX_GEO_URL_LENGTH).optional(),
  userAgent: string().max(MAX_GEO_FIELD_LENGTH).optional(),
  accept: string().max(MAX_GEO_FIELD_LENGTH).optional(),
  acceptLanguage: string().max(MAX_GEO_FIELD_LENGTH).optional(),
  requestId: string().max(MAX_GEO_SHORT_FIELD_LENGTH).optional(),
});

export const geoTrafficJourneysInputSchema = object({
  organizationId: string().min(1),
  days: number().int().min(1).max(MAX_DAYS).optional(),
  limit: number().int().min(1).max(MAX_AI_TRAFFIC_JOURNEYS_LIMIT).optional(),
});

export const geoJourneyDetailInputSchema = object({
  organizationId: string().min(1),
  journeyId: string().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH),
  days: number().int().min(1).max(MAX_DAYS).optional(),
});

export const geoTrafficPagesInputSchema = object({
  organizationId: string().min(1),
  days: number().int().min(1).max(MAX_DAYS).optional(),
  limit: number().int().min(1).max(MAX_AI_TRAFFIC_PAGES_LIMIT).optional(),
  visitorType: enumType(["crawler", "ai_referral"]).optional(),
});
