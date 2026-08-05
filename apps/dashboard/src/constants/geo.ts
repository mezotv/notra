import { LANGUAGE_FLAGS } from "@/constants/brand-identity";
import type {
  GeoGroundedEngine,
  GeoTab,
  GeoTrafficLogPurposeOption,
  GeoTrafficLogVisitorOption,
} from "@/types/geo";

export const GEO_ENGINES = [
  "openai/gpt-5.4",
  "anthropic/claude-sonnet-4.6",
  "google/gemini-3-flash",
  "anthropic/claude-opus-5",
  "anthropic/claude-haiku-4.5",
  "openai/gpt-5.4-mini",
] as const;

export const GEO_JUDGE_MODEL = "openai/gpt-5.4-nano";

export const GEO_OPENAI_API_KEY_ENV = "OPENAI_API_KEY";
export const GEO_ANTHROPIC_API_KEY_ENV = "ANTHROPIC_API_KEY";
export const GEO_PERPLEXITY_API_KEY_ENV = "PERPLEXITY_API_KEY";

const hasEnv = (name: string): boolean => {
  const value = process.env[name];
  return typeof value === "string" && value.length > 0;
};

export const GEO_GROUNDED_ENGINES: readonly GeoGroundedEngine[] = [
  {
    key: "openai/gpt-5.4-grounded",
    label: "ChatGPT (web)",
    model: "openai/gpt-5.4",
    provider: "gateway-openai",
    envVar: null,
    isAvailable: () => true,
  },
  {
    key: "anthropic/claude-sonnet-4.6-grounded",
    label: "Claude (web)",
    model: "anthropic/claude-sonnet-4.6",
    provider: "gateway-anthropic",
    envVar: null,
    isAvailable: () => true,
  },
  {
    key: "google/gemini-3-flash-grounded",
    label: "Gemini (web)",
    model: "google/gemini-3-flash",
    provider: "gateway-google",
    envVar: null,
    isAvailable: () => true,
  },
  {
    key: "openai-direct-grounded",
    label: "ChatGPT (web)",
    model: "gpt-5.4",
    provider: "direct-openai",
    envVar: GEO_OPENAI_API_KEY_ENV,
    isAvailable: () => hasEnv(GEO_OPENAI_API_KEY_ENV),
  },
  {
    key: "anthropic-direct-grounded",
    label: "Claude (web)",
    model: "claude-sonnet-4-6",
    provider: "direct-anthropic",
    envVar: GEO_ANTHROPIC_API_KEY_ENV,
    isAvailable: () => hasEnv(GEO_ANTHROPIC_API_KEY_ENV),
  },
  {
    key: "perplexity-sonar",
    label: "Perplexity",
    model: "sonar",
    provider: "direct-perplexity",
    envVar: GEO_PERPLEXITY_API_KEY_ENV,
    isAvailable: () => hasEnv(GEO_PERPLEXITY_API_KEY_ENV),
  },
];

const groundedEngineLabels = Object.fromEntries(
  GEO_GROUNDED_ENGINES.map((engine) => [engine.key, engine.label])
);

export const GEO_ENGINE_LABELS: Record<string, string> = {
  "openai/gpt-5.4": "ChatGPT",
  "anthropic/claude-sonnet-4.6": "Claude",
  "google/gemini-3-flash": "Gemini",
  "anthropic/claude-opus-5": "Claude Opus",
  "anthropic/claude-haiku-4.5": "Claude Haiku",
  "openai/gpt-5.4-mini": "GPT-5.4 mini",
  ...groundedEngineLabels,
};

export const GEO_MODEL_USAGE_SOURCE = "openrouter";
export const GEO_MODEL_USAGE_ATTRIBUTION =
  "Source: OpenRouter (openrouter.ai/rankings)";
export const GEO_MODEL_USAGE_API_KEY_ENV = "OPENROUTER_API_KEY";
export const GEO_MODEL_USAGE_ENDPOINT =
  "https://openrouter.ai/api/v1/datasets/rankings-daily";
export const GEO_MODEL_USAGE_PERIOD = "week";
export const GEO_MODEL_USAGE_OTHER_KEY = "other";
export const GEO_MODEL_USAGE_MODELS_ENDPOINT =
  "https://openrouter.ai/api/v1/models";
export const GEO_MODEL_USAGE_INGEST_LIMIT = 40;
export const GEO_MODEL_USAGE_FETCH_TIMEOUT_MS = 20_000;
export const GEO_MODEL_USAGE_DEFAULT_LIMIT = 12;
export const GEO_MODEL_USAGE_DEFAULT_WEEKS = 8;

export const GEO_MAX_PROMPTS = 8;
export const GEO_GROUNDED_MAX_PROMPTS = 6;
export const GEO_GROUNDED_MAX_SEARCHES = 3;
export const GEO_ANSWER_MAX_TOKENS = 600;
export const GEO_GROUNDED_ANSWER_MAX_TOKENS = 1200;
export const GEO_JUDGE_MAX_TOKENS = 800;
export const GEO_SCAN_CONCURRENCY = 4;
export const GEO_EXCERPT_MAX_LENGTH = 300;
export const GEO_PROMPT_MIN_LENGTH = 8;
export const GEO_PROMPT_MAX_LENGTH = 300;
export const GEO_DISCOVERY_MODEL = "anthropic/claude-sonnet-4.6";
export const GEO_DISCOVERY_MAX_TOKENS = 4000;
export const GEO_DISCOVERY_MAX_ALIASES = 6;
export const GEO_DISCOVERY_MIN_COMPETITORS = 5;
export const GEO_DISCOVERY_MAX_COMPETITORS = 10;
export const GEO_DISCOVERY_MIN_PROMPTS = 10;
export const GEO_DISCOVERY_MAX_PROMPTS = 14;
export const GEO_DISCOVERY_MAX_BRANDED_PROMPTS = 3;
export const GEO_DISCOVERY_ALIAS_LIMIT = 8;
export const GEO_DISCOVERY_COMPETITOR_LIMIT = 12;
export const GEO_DISCOVERY_SYSTEM_PROMPT =
  "You are a search visibility analyst. You read a company's website and derive the brand identity and the buyer questions that decide whether an AI assistant recommends this company. Respond only with the requested structured data.";
export const GEO_ANSWER_SYSTEM_PROMPT =
  "You are a helpful AI assistant. Answer the user's question directly and concretely, naming specific products or companies where relevant.";

export const AI_TRAFFIC_DEFAULT_DAYS = 30;
export const AI_TRAFFIC_DEFAULT_LOG_LIMIT = 50;
export const AI_TRAFFIC_DEFAULT_PAGES_LIMIT = 20;
export const GEO_INGEST_PATH = "/api/geo/ingest";
export const GEO_INGEST_SECRET_ENV = "GEO_INGEST_SECRET";
export const GEO_INGEST_SECRET_FALLBACK_ENV = "BEACON_INGEST_SECRET";
export const GEO_INGEST_TOKEN_SEPARATOR = ".";
export const GEO_INGEST_BEARER_PREFIX = "Bearer ";
export const GEO_MAX_STORED_UA_LENGTH = 512;
export const GEO_MARKDOWN_ACCEPT_MATCHERS: readonly string[] = [
  "text/markdown",
  "text/x-markdown",
];
export const AI_TRAFFIC_DEFAULT_JOURNEYS_LIMIT = 25;

export const OWN_BRAND_ROW_ID = "own-brand";

export const COMPETITOR_KIND_HINT =
  "Direct sells what you sell. Indirect solves the same problem differently.";

export const COMPETITOR_TYPE_FILTER_VALUES = [
  "all",
  "direct",
  "indirect",
] as const;

export const COMPETITOR_TYPE_FILTERS = [
  { value: "all", label: "All types" },
  { value: "direct", label: "Direct" },
  { value: "indirect", label: "Indirect" },
] as const;

export const COMPETITORS_TABLE_HEIGHT = 420;
export const COMPETITOR_PROMPTS_TABLE_HEIGHT = 288;
export const COMPETITOR_PROMPTS_PAGE_TABLE_HEIGHT = 620;
export const COMPETITORS_TABLE_ROW_HEIGHT = 52;

export const GEO_JOURNEY_DEPTH_THRESHOLDS = [1, 2, 3, 5, 10] as const;

export const GEO_JOURNEY_PARAM = "ntr";
export const GEO_JOURNEY_EXPLICIT_PREFIX = "n_";
export const GEO_JOURNEY_FINGERPRINT_PREFIX = "f_";
export const GEO_JOURNEY_BUCKET_SECONDS = 1800;
export const GEO_JOURNEY_BROWSE_BUCKET_SECONDS = 600;
export const GEO_JOURNEY_BROWSE_CATEGORY = "assistant-browse";
export const GEO_JOURNEY_HASH_LENGTH = 16;
export const GEO_JOURNEY_IPV4_OCTETS = 3;
export const GEO_JOURNEY_IPV6_GROUPS = 4;
export const GEO_JOURNEY_CHIP_LENGTH = 6;
export const GEO_JOURNEY_DETAIL_LIMIT = 200;
export const GEO_JOURNEY_DETAIL_MIN_EVENTS = 2;
export const GEO_JOURNEY_DETAIL_SERIES_KEY = "pages";

export const GEO_AI_REFERRER_HOSTS: Record<string, string> = {
  "chatgpt.com": "chatgpt",
  "chat.openai.com": "chatgpt",
  "perplexity.ai": "perplexity",
  "www.perplexity.ai": "perplexity",
  "gemini.google.com": "gemini",
  "bard.google.com": "gemini",
  "claude.ai": "claude",
  "copilot.microsoft.com": "copilot",
  "www.bing.com/chat": "copilot",
  "you.com": "you",
  "chat.deepseek.com": "deepseek",
  "chat.mistral.ai": "mistral",
  "grok.com": "grok",
  "x.ai": "grok",
  "chat.qwen.ai": "qwen",
};

export const GEO_AI_REFERRER_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  claude: "Claude",
  copilot: "Copilot",
  you: "You.com",
  deepseek: "DeepSeek",
  mistral: "Mistral",
  grok: "Grok",
  qwen: "Qwen",
};

export const GEO_NON_AI_BOT_PATTERNS: readonly string[] = [
  "googlebot",
  "bingbot",
  "duckduckbot",
  "yandexbot",
  "baiduspider",
  "slurp",
  "ahrefsbot",
  "semrushbot",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "telegrambot",
  "whatsapp",
  "uptimerobot",
  "pingdom",
];

export const GEO_BROWSER_UA_PATTERNS: readonly string[] = [
  "mozilla/",
  "applewebkit",
  "chrome/",
  "safari/",
  "firefox/",
  "edg/",
  "opera",
];

export const GEO_VISITOR_TYPE_LABELS: Record<string, string> = {
  crawler: "AI crawler",
  ai_referral: "AI referral",
  human: "Human",
  unknown: "Unknown",
};

export const AI_TRAFFIC_PURPOSE_LABELS: Record<string, string> = {
  "training-crawler": "Training data",
  "search-index": "Search index",
  "assistant-browse": "Used in answer",
  "assistant-referral": "Referral",
};

export const AI_TRAFFIC_PURPOSE_DESCRIPTIONS: Record<string, string> = {
  "training-crawler": "Collects pages for model training corpora",
  "search-index": "Builds the index an AI answer engine searches",
  "assistant-browse":
    "Fetched while an assistant was answering someone. A fetch is not proof of a citation",
  "assistant-referral":
    "A person clicked through to your site from an AI answer",
};

export const GEO_TRAFFIC_LOG_FILTER_ALL = "all";

export const GEO_TRAFFIC_LOG_VISITOR_OPTIONS: readonly GeoTrafficLogVisitorOption[] =
  [
    { value: GEO_TRAFFIC_LOG_FILTER_ALL, label: "All visitors" },
    { value: "crawler", label: "AI crawler" },
    { value: "ai_referral", label: "AI referral" },
    { value: "human", label: "Human" },
  ];

export const GEO_TRAFFIC_LOG_PURPOSE_OPTIONS: readonly GeoTrafficLogPurposeOption[] =
  [
    { value: GEO_TRAFFIC_LOG_FILTER_ALL, label: "All purposes" },
    { value: "training-crawler", label: "Training data" },
    { value: "search-index", label: "Search index" },
    { value: "assistant-browse", label: "Used in answer" },
  ];

export const GEO_JOURNEY_KIND_LABELS: Record<string, string> = {
  tagged: "Tagged journey, followed a tagged link",
  fingerprint: "Fingerprinted journey, matched by heuristic",
};

export const AI_TRAFFIC_CONFIDENCE_LABELS: Record<string, string> = {
  verified: "Verified",
  reported: "Reported",
  heuristic: "Heuristic",
};

export const GEO_PRESENCE_LABELS: Record<string, string> = {
  "training-data": "Training data",
  "retrieval-only": "Retrieval only",
  invisible: "Invisible",
};

export const GEO_PRESENCE_DOT_CLASSES: Record<string, string> = {
  "training-data": "bg-emerald-500",
  "retrieval-only": "bg-amber-500",
  invisible: "bg-muted-foreground/50",
};

export const GEO_TREND_MIN_DAYS = 5;

export const GEO_MAX_LANGUAGES = 3;
export const GEO_LANGUAGE_MAX_PROMPTS = 5;
export const GEO_LANGUAGE_GROUNDED_MAX_PROMPTS = 3;
export const GEO_TRANSLATION_MAX_TOKENS = 2000;

export const GEO_LANGUAGE_FLAGS: Record<string, string> = LANGUAGE_FLAGS;

export const COPY_FEEDBACK_MS = 2000;

export const GEO_TAB_VALUES = [
  "visibility",
  "prompts",
  "traffic",
  "journeys",
] as const satisfies readonly GeoTab[];

export const GEO_DEFAULT_TAB: GeoTab = "visibility";

export const GEO_PROMPTS_TAB_LIMIT = 12;

export const GEO_LOGO_LINK_BASE = "https://logos.context.dev/";
export const GEO_LOGO_LINK_CLIENT_ID_ENV = "NEXT_PUBLIC_LOGOLINK_CLIENT_ID";
export const GEO_LOGO_SIZE_PX = 40;

export const GEO_COMPETITOR_DETAIL_DAYS = 30;
export const GEO_COMPETITOR_DETAIL_MIN_POINTS = 2;
export const GEO_COMPETITOR_DETAIL_SERIES_KEY = "mentions";
