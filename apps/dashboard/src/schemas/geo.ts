import { SUPPORTED_LANGUAGES } from "@notra/ai/constants/languages";
import { geoContentSubtypeSchema } from "@notra/ai/schemas/geo-writer";
import {
  array,
  boolean,
  enum as enumType,
  number,
  object,
  record,
  string,
} from "zod";
import {
  GEO_BRAND_SEARCH_MAX_QUERY_LENGTH,
  GEO_BRAND_SEARCH_MIN_QUERY_LENGTH,
  GEO_DISCOVERY_MAX_ALIASES,
  GEO_DISCOVERY_MAX_COMPETITORS,
  GEO_DISCOVERY_MAX_PROMPTS,
  GEO_DISCOVERY_MIN_COMPETITORS,
  GEO_DISCOVERY_MIN_PROMPTS,
  GEO_GAP_TITLE_MAX_LENGTH,
  GEO_MAX_ALIASES,
  GEO_MAX_COMPETITORS,
  GEO_MAX_ENGINES,
  GEO_MAX_LANGUAGES,
  GEO_ONBOARDING_MAX_PROMPTS,
  GEO_PROMPT_MAX_LENGTH,
  GEO_PROMPT_MIN_LENGTH,
  GEO_SCAN_INTERVAL_HOURS,
  GEO_SEQUENCE_MAX_TURNS,
  GEO_WRITER_TOPIC_MAX_LENGTH,
  GEO_WRITER_TOPIC_MIN_LENGTH,
} from "@/constants/geo";
import { normalizeCompetitorDomain } from "@/lib/geo/domain";
import { publicWebsiteUrlSchema } from "@/schemas/url";

const GEO_SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES);
const MAX_GEO_TRAFFIC_LOG_FILTER_VALUES = 3;
const MAX_JUDGE_COMPETITORS = 15;
const MAX_EXCERPT_LENGTH = 300;
const MAX_DAYS = 365;
const GEO_DAY_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const geoWindowFields = {
  days: number().int().min(1).max(MAX_DAYS).optional(),
  from: string().regex(GEO_DAY_STRING_REGEX).optional(),
  to: string().regex(GEO_DAY_STRING_REGEX).optional(),
};
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

export const geoOrganizationInputSchema = object({
  organizationId: string().min(1),
  projectId: string().min(1).optional(),
});

export const geoModelCatalogInputSchema = object({
  organizationId: string().min(1),
});

export const geoSettingsUpsertInputSchema = geoOrganizationInputSchema.extend({
  companyName: string().min(1),
  aliases: array(string().min(1)).max(GEO_MAX_ALIASES),
  competitors: array(string().min(1)).max(GEO_MAX_COMPETITORS),
  languages: array(string().min(1))
    .min(1)
    .max(GEO_MAX_LANGUAGES)
    .refine(
      (values) =>
        values.every((value) => GEO_SUPPORTED_LANGUAGE_SET.has(value)),
      {
        message: "Unsupported language",
      }
    ),
  engines: array(string().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH))
    .min(1)
    .max(GEO_MAX_ENGINES),
  enforceZdr: boolean(),
  nonZdrApprovedEngines: array(
    string().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH)
  ).max(GEO_MAX_ENGINES),
  enabled: boolean(),
  scanIntervalHours: number().refine(
    (value) => GEO_SCAN_INTERVAL_HOURS.some((interval) => interval === value),
    { message: "Unsupported scan interval" }
  ),
});

export const geoCompetitorDomainSchema = string()
  .trim()
  .max(MAX_GEO_SHORT_FIELD_LENGTH)
  .transform(normalizeCompetitorDomain)
  .refine((value) => value === null || GEO_DOMAIN_REGEX.test(value), {
    message: "Enter a domain like example.com",
  });

export const geoCompetitorUpsertInputSchema = geoOrganizationInputSchema.extend(
  {
    name: string().trim().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH),
    previousName: string()
      .trim()
      .min(1)
      .max(MAX_GEO_SHORT_FIELD_LENGTH)
      .optional(),
    domain: geoCompetitorDomainSchema.nullable(),
    synonyms: array(string().trim().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH))
      .max(MAX_GEO_COMPETITOR_SYNONYMS)
      .optional(),
    kind: enumType(["direct", "indirect"]).optional(),
    color: string()
      .trim()
      .max(MAX_GEO_SHORT_FIELD_LENGTH)
      .nullable()
      .optional(),
  }
);

export const geoCompetitorDeleteInputSchema = geoOrganizationInputSchema.extend(
  {
    name: string().trim().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH),
  }
);

export const geoCompetitorDetailInputSchema = geoOrganizationInputSchema.extend(
  {
    brand: string().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH),
    ...geoWindowFields,
  }
);

export const geoTranslationResultSchema = object({
  translations: array(string().min(1)),
});

export const geoSequenceCreateInputSchema = geoOrganizationInputSchema.extend({
  id: string().uuid().optional(),
  name: string().trim().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH),
  steps: array(string().trim().min(MIN_PROMPT_LENGTH).max(MAX_PROMPT_LENGTH))
    .min(1)
    .max(GEO_SEQUENCE_MAX_TURNS),
});

export const geoSequenceUpdateInputSchema = geoOrganizationInputSchema.extend({
  sequenceId: string().min(1),
  name: string().trim().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH).optional(),
  steps: array(string().trim().min(MIN_PROMPT_LENGTH).max(MAX_PROMPT_LENGTH))
    .min(1)
    .max(GEO_SEQUENCE_MAX_TURNS)
    .optional(),
  enabled: boolean().optional(),
});

export const geoSequenceDeleteInputSchema = geoOrganizationInputSchema.extend({
  sequenceId: string().min(1),
});

export const geoSequenceResultsInputSchema = geoOrganizationInputSchema.extend({
  sequenceId: string().min(1).optional(),
});

export const geoProjectCreateInputSchema = object({
  organizationId: string().min(1),
  name: string().trim().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH),
  brandSettingsId: string().min(1),
});

export const geoTimeseriesInputSchema = geoOrganizationInputSchema.extend({
  ...geoWindowFields,
});

export const geoPromptCreateInputSchema = geoOrganizationInputSchema.extend({
  id: string().uuid().optional(),
  prompt: string().min(MIN_PROMPT_LENGTH).max(MAX_PROMPT_LENGTH),
});

export const geoPromptDeleteInputSchema = geoOrganizationInputSchema.extend({
  promptId: string().min(1),
});

export const geoPromptToggleInputSchema = geoOrganizationInputSchema.extend({
  promptId: string().min(1),
  enabled: boolean(),
});

export const geoGenerateFromWebsiteInputSchema =
  geoOrganizationInputSchema.extend({
    url: publicWebsiteUrlSchema,
  });

const geoTrackingLanguagesSchema = array(string().min(1))
  .min(1)
  .max(GEO_MAX_LANGUAGES)
  .refine(
    (values) => values.every((value) => GEO_SUPPORTED_LANGUAGE_SET.has(value)),
    {
      message: "Unsupported language",
    }
  );

export const geoOnboardingBrandInputSchema = geoOrganizationInputSchema.extend({
  companyName: string().trim().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH),
  aliases: array(string().trim().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH)).max(
    GEO_MAX_ALIASES
  ),
  prompts: array(
    object({
      prompt: string().trim().min(MIN_PROMPT_LENGTH).max(MAX_PROMPT_LENGTH),
      title: string().trim().min(1).max(GEO_GAP_TITLE_MAX_LENGTH),
    })
  ).max(GEO_ONBOARDING_MAX_PROMPTS),
  languages: geoTrackingLanguagesSchema.optional(),
  engines: array(string().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH))
    .min(1)
    .max(GEO_MAX_ENGINES)
    .optional(),
  enforceZdr: boolean().optional(),
  nonZdrApprovedEngines: array(string().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH))
    .max(GEO_MAX_ENGINES)
    .optional(),
});

export const geoCompetitorSuggestionsInputSchema =
  geoOrganizationInputSchema.extend({
    domain: geoCompetitorDomainSchema.refine((value) => value !== null, {
      message: "Enter a domain like example.com",
    }),
  });

export const geoCompetitorSuggestionsResponseSchema = object({
  domain: string().min(1),
  field: string().nullable(),
  competitors: array(
    object({
      name: string().min(1),
      domain: string().nullable(),
      description: string().nullable(),
      confidence: enumType(["high", "medium"]).nullable(),
    })
  ),
});

export const geoBrandSearchInputSchema = geoOrganizationInputSchema.extend({
  query: string()
    .trim()
    .min(GEO_BRAND_SEARCH_MIN_QUERY_LENGTH)
    .max(GEO_BRAND_SEARCH_MAX_QUERY_LENGTH),
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
  prompts: array(
    object({
      prompt: string().min(MIN_PROMPT_LENGTH).max(MAX_PROMPT_LENGTH),
      title: string().min(1).max(GEO_GAP_TITLE_MAX_LENGTH),
    })
  )
    .min(GEO_DISCOVERY_MIN_PROMPTS)
    .max(GEO_DISCOVERY_MAX_PROMPTS),
});

export const geoModelUsageInputSchema = geoOrganizationInputSchema.extend({
  ...geoWindowFields,
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

export const openRouterRankingsChartSchema = object({
  data: object({
    data: array(
      object({
        x: string().min(1),
        ys: record(string(), number()),
      })
    ),
  }),
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

export const aiTrafficInputSchema = geoOrganizationInputSchema.extend({
  ...geoWindowFields,
  limit: number().int().min(1).max(MAX_AI_TRAFFIC_LOG_LIMIT).optional(),
});

export const geoTrafficLogInputSchema = geoOrganizationInputSchema.extend({
  limit: number().int().min(1).max(MAX_AI_TRAFFIC_LOG_LIMIT).optional(),
  visitorTypes: array(enumType(["crawler", "ai_referral", "human"]))
    .max(MAX_GEO_TRAFFIC_LOG_FILTER_VALUES)
    .optional(),
  categories: array(
    enumType(["training-crawler", "search-index", "assistant-browse"])
  )
    .max(MAX_GEO_TRAFFIC_LOG_FILTER_VALUES)
    .optional(),
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
  signals: object({
    clientHints: boolean(),
    fetchMode: string().max(MAX_GEO_SHORT_FIELD_LENGTH).nullable(),
    tracing: boolean(),
  }).optional(),
});

export const geoTrafficJourneysInputSchema = geoOrganizationInputSchema.extend({
  ...geoWindowFields,
  limit: number().int().min(1).max(MAX_AI_TRAFFIC_JOURNEYS_LIMIT).optional(),
});

export const geoJourneyDetailInputSchema = geoOrganizationInputSchema.extend({
  journeyId: string().min(1).max(MAX_GEO_SHORT_FIELD_LENGTH),
  ...geoWindowFields,
});

export const geoTrafficPagesInputSchema = geoOrganizationInputSchema.extend({
  ...geoWindowFields,
  limit: number().int().min(1).max(MAX_AI_TRAFFIC_PAGES_LIMIT).optional(),
  visitorType: enumType(["crawler", "ai_referral"]).optional(),
});

export const geoWriterPlanInputSchema = geoOrganizationInputSchema.extend({
  topic: string()
    .trim()
    .min(GEO_WRITER_TOPIC_MIN_LENGTH)
    .max(GEO_WRITER_TOPIC_MAX_LENGTH),
  autoApprove: boolean().default(false),
  contentSubtype: geoContentSubtypeSchema.optional(),
  brandVoiceIds: array(string().min(1)).max(8).optional(),
  competitorIds: array(string().min(1)).max(GEO_MAX_COMPETITORS).optional(),
  sitemapId: string().min(1).optional(),
  sourceKind: enumType([
    "manual",
    "gap",
    "prompt",
    "search_console",
  ]).optional(),
  sourceId: string().min(1).optional(),
});

export const geoWriterBriefIdInputSchema = geoOrganizationInputSchema.extend({
  briefId: string().min(1),
});

export const geoWriterWorkflowPayloadSchema = object({
  organizationId: string().min(1),
  projectId: string().min(1),
  briefId: string().min(1),
  runId: string().min(1),
});

export const geoSuggestionIdInputSchema = object({
  organizationId: string().min(1),
  suggestionId: string().min(1),
});
