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
import { publicWebsiteUrlSchema } from "@/schemas/url";

const GEO_SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES);
const MAX_ALIASES = 10;
const MAX_COMPETITORS = 10;
const MAX_JUDGE_COMPETITORS = 15;
const MAX_EXCERPT_LENGTH = 300;
const MAX_DAYS = 365;
const MAX_MODEL_USAGE_LIMIT = 50;
const MAX_AI_TRAFFIC_LOG_LIMIT = 200;
const MAX_BEACON_FIELD_LENGTH = 512;
const MAX_BEACON_METHOD_LENGTH = 16;
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
  competitors: array(string().min(1))
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

export const beaconEventSchema = object({
  token: string().min(1).max(MAX_BEACON_FIELD_LENGTH),
  organizationId: string().min(1).max(MAX_BEACON_FIELD_LENGTH),
  agent: string().min(1).max(MAX_BEACON_FIELD_LENGTH),
  category: enumType(["training-crawler", "search-index", "assistant-browse"]),
  confidence: enumType(["verified", "reported", "heuristic"]),
  path: string().min(1).max(MAX_BEACON_FIELD_LENGTH),
  host: string().min(1).max(MAX_BEACON_FIELD_LENGTH),
  method: string().min(1).max(MAX_BEACON_METHOD_LENGTH),
  referer: string().max(MAX_BEACON_FIELD_LENGTH).nullable(),
  ua: string().max(MAX_BEACON_FIELD_LENGTH),
  ts: string().min(1).max(MAX_BEACON_FIELD_LENGTH),
});
