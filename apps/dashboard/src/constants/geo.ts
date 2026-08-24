import {
  BookOpen01Icon,
  BubbleChatQuestionIcon,
  GitCompareIcon,
  GlobalIcon,
  Layers01Icon,
  LeftToRightListNumberIcon,
  PaintBrush01Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { LANGUAGE_FLAGS } from "@/constants/brand-identity";
import { GEO_MODEL_CATALOG_SEED } from "@/constants/geo-model-catalog";
import type {
  AiTrafficResponse,
  GeoCompetitorKind,
  GeoGroundedEngine,
  GeoIngestFramework,
  GeoIngestPackageManager,
  GeoPromptResult,
  GeoRangePreset,
  GeoTab,
  GeoTimeseriesPoint,
  GeoTrafficLogPurposeOption,
  GeoTrafficLogVisitorOption,
} from "@/types/geo";

export const GEO_MAX_ENGINES = 64;
export const GEO_MODEL_CATALOG_STALE_MS = 60 * 60 * 1000;

/** Projects without the ZDR add-on cannot enforce ZDR; the server forces it off. */
export const GEO_ZDR_FEATURE_LABEL = "Zero data retention";

export const GEO_JUDGE_MODEL = "openai/gpt-5.4-nano";

export const GEO_OPENAI_API_KEY_ENV = "OPENAI_API_KEY";
export const GEO_ANTHROPIC_API_KEY_ENV = "ANTHROPIC_API_KEY";
export const GEO_PERPLEXITY_API_KEY_ENV = "PERPLEXITY_API_KEY";
export const GEO_CURSOR_API_KEY_ENV = "CURSOR_API_KEY";

/** Catalog id of the Cursor engine; the SDK model id is the slug part. */
export const GEO_CURSOR_ENGINE_ID = "cursor/composer-2.5";
export const GEO_CURSOR_MODEL_ID = "composer-2.5";
/** Local Cursor runs took ~8s in testing; cold starts can be slower. */
export const GEO_CURSOR_TIMEOUT_MS = 90_000;
/** Databuddy flag that exposes the Cursor engine to an organization. */
export const GEO_CURSOR_FLAG_KEY = "geo-cursor";
export const GEO_CURSOR_FLAG_CACHE_TTL_MS = 60_000;
export const GEO_CURSOR_FLAG_STALE_TIME_MS = 30_000;
export const GEO_CURSOR_FLAG_ERROR_REASON = "ERROR";

/** Databuddy flag that exposes the GEO writer to an organization. */
export const GEO_WRITER_FLAG_KEY = "geo-writer";
export const GEO_WRITER_NAV_LINK = "/geo/write";
export const GEO_GAPS_NAV_LINK = "/geo/gaps";
export const GEO_PROMPTS_NAV_LINK = "/geo/prompts";
export const GEO_WRITER_TOPIC_MIN_LENGTH = 3;
export const GEO_WRITER_TOPIC_MAX_LENGTH = 8000;
export const GEO_WRITER_GAP_LOOKBACK_DAYS = 30;
export const GEO_WRITER_PLANNER_GAP_LIMIT = 20;
export const GEO_WRITER_SITEMAP_PAGE_LIMIT = 60;
export const GEO_WRITER_BRIEF_POLL_INTERVAL_MS = 3000;
export const GEO_WRITER_BRIEFS_LIMIT = 20;
export const GEO_GAPS_MAX_CHECKS = 400;
export const GEO_GAPS_SEARCH_LIMIT = 100;
/** Fallback before the gaps table measures remaining viewport height. */
export const GEO_GAPS_TABLE_HEIGHT = 420;
export const GEO_GAPS_METER_STEPS = 5;
export const GEO_GAPS_METER_TONE_CLASS = {
  empty: "bg-muted",
  low: "bg-geo-down",
  mid: "bg-geo-mid",
  high: "bg-geo-up",
} as const;
export const GEO_GAPS_LOGO_STACK_LIMIT = 4;
export const GEO_GAPS_WRITE_LABELS = {
  write: "Write",
  review: "Review",
  writing: "Writing",
  open: "Open post",
} as const;
export const GEO_GAPS_EMPTY = {
  scanning: {
    title: "Scanning engines",
    description: "Gaps appear here once the scan finishes.",
  },
  "no-scan": {
    title: "No scan yet",
    description:
      "Run a scan to see which questions AI engines answer without mentioning you.",
    action: "Run scan",
  },
  "no-prompt-gaps": {
    title: "No prompt gaps",
    description: "Engines already mention you on the questions you track.",
  },
  "no-search-gaps": {
    title: "No search gaps",
    description:
      "Connect Search Console on Prompts to pull queries you don't cover yet.",
    action: "Open Prompts",
  },
  "no-matches": {
    title: "No matching gaps",
    description:
      "Nothing matches these filters. Try a different search or engine.",
  },
} as const;
export const GEO_GAPS_ENGINE_FILTER_ALL = "all";
export const GEO_WRITER_TRIGGER_ID = "geo_writer";
export const GEO_WRITER_TRIGGER_NAME = "GEO Writer";

export const GEO_WRITE_CONTENT_SUBTYPES = [
  {
    id: "guide" as const,
    label: "Guide",
    description: "A long article that answers the prompt directly.",
    icon: BookOpen01Icon,
    iconClass: "text-muted-foreground",
  },
  {
    id: "listicle" as const,
    label: "Listicle",
    description: "A numbered list that buyers can scan and cite.",
    icon: LeftToRightListNumberIcon,
    iconClass: "text-muted-foreground",
  },
  {
    id: "comparison" as const,
    label: "Comparison",
    description: "Compares the brand with its alternatives.",
    icon: GitCompareIcon,
    iconClass: "text-muted-foreground",
  },
];

export const GEO_WRITE_SIDEBAR_SHORTCUT = "b";
export const GEO_WRITE_PANEL_HEADER_CLASS =
  "overflow-hidden rounded-t-2xl border border-border border-b-0 bg-muted pb-5";
export const GEO_WRITE_PANEL_HEADER_ROW_CLASS = "flex h-10 items-center";
export const GEO_WRITE_PANEL_FOOTER_CLASS =
  "-mt-5 overflow-hidden rounded-b-2xl border border-border border-t-0 bg-muted pt-5";
export const GEO_WRITE_PANEL_FOOTER_ROW_CLASS = "flex min-h-12 items-center";
export const GEO_WRITE_SIDEBAR_WIDTH = "13rem";
export const GEO_WRITE_DIALOG_SECTIONS = [
  {
    id: "prompt" as const,
    label: "Prompt",
    required: true,
    icon: BubbleChatQuestionIcon,
  },
  {
    id: "type" as const,
    label: "Format",
    required: true,
    icon: Layers01Icon,
  },
  {
    id: "brand" as const,
    label: "Brand identity",
    required: false,
    icon: PaintBrush01Icon,
  },
  {
    id: "sitemap" as const,
    label: "Sitemap",
    required: false,
    icon: GlobalIcon,
  },
  {
    id: "competitors" as const,
    label: "Competitors",
    required: false,
    icon: UserMultiple02Icon,
  },
];
export const GEO_WRITE_SITEMAP_SKELETON_KEYS = ["sitemap-1", "sitemap-2"];
export const GEO_WRITE_TABLE_HEIGHT = 420;
export const GEO_WRITE_TABLE_ROW_HEIGHT = 56;
export const GEO_WRITE_TABLE_MIN_ROWS = 4;
export const GEO_WRITE_BRIEF_STATUS_LABELS = {
  draft: "Draft",
  approved: "Queued",
  writing: "Writing",
  completed: "Done",
  failed: "Failed",
} as const;

const hasEnv = (name: string): boolean => {
  const value = process.env[name];
  return typeof value === "string" && value.length > 0;
};

export const GEO_GROUNDED_ENGINES: readonly GeoGroundedEngine[] = [
  {
    key: "openai/gpt-5.4-grounded",
    label: "ChatGPT",
    model: "openai/gpt-5.4",
    provider: "gateway-openai",
    envVar: null,
    isAvailable: () => true,
  },
  {
    key: "anthropic/claude-sonnet-4.6-grounded",
    label: "Claude Sonnet",
    model: "anthropic/claude-sonnet-4.6",
    provider: "gateway-anthropic",
    envVar: null,
    isAvailable: () => true,
  },
  {
    key: "google/gemini-3-flash-grounded",
    label: "Gemini",
    model: "google/gemini-3-flash",
    provider: "gateway-google",
    envVar: null,
    isAvailable: () => true,
  },
  {
    key: "openai-direct-grounded",
    label: "ChatGPT",
    model: "gpt-5.4",
    provider: "direct-openai",
    envVar: GEO_OPENAI_API_KEY_ENV,
    isAvailable: () => hasEnv(GEO_OPENAI_API_KEY_ENV),
  },
  {
    key: "anthropic-direct-grounded",
    label: "Claude Sonnet",
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

const catalogEngineLabels = Object.fromEntries(
  GEO_MODEL_CATALOG_SEED.map((entry) => [entry.id, entry.label])
);

export const GEO_ENGINE_LABELS: Record<string, string> = {
  ...catalogEngineLabels,
  ...groundedEngineLabels,
};

export const GEO_BRAND_LABELS: Record<string, string> = {
  openai: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  cursor: "Cursor",
  copilot: "Copilot",
  mistral: "Mistral",
  deepseek: "DeepSeek",
  meta: "Meta",
  grok: "Grok",
  moonshot: "Kimi",
  zai: "GLM",
  qwen: "Qwen",
  tencent: "Hunyuan",
  xiaomi: "Xiaomi",
};

export const GEO_SEARCH_LABEL = "Search";
export const GEO_WITHOUT_SEARCH_LABEL = "Without search";

export const GEO_MODEL_USAGE_SOURCE = "openrouter";
export const GEO_MODEL_USAGE_ATTRIBUTION =
  "Source: OpenRouter (openrouter.ai/rankings)";
export const GEO_MODEL_USAGE_API_KEY_ENV = "OPENROUTER_API_KEY";
export const GEO_MODEL_USAGE_ENDPOINT =
  "https://openrouter.ai/api/frontend/v1/rankings/model-rankings-chart";
export const GEO_MODEL_USAGE_PERIOD = "week";
export const GEO_MODEL_USAGE_OTHER_KEY = "other";
export const GEO_MODEL_USAGE_CACHE_KEY = "openrouter:model-rankings-chart";
export const GEO_MODEL_USAGE_SLUGS_CACHE_KEY = "openrouter:models";
export const GEO_MODEL_USAGE_OTHERS_LABEL = "Others";
export const GEO_MODEL_USAGE_MODELS_ENDPOINT =
  "https://openrouter.ai/api/v1/models";
export const GEO_MODEL_USAGE_INGEST_LIMIT = 40;
export const GEO_MODEL_USAGE_FETCH_TIMEOUT_MS = 20_000;
export const GEO_MODEL_USAGE_DEFAULT_LIMIT = 8;
export const GEO_MODEL_USAGE_TREND_WEEKS = 16;
export const GEO_MODEL_USAGE_CHART_HEIGHT_CLASS = "h-80";

export const GEO_MAX_PROMPTS = 8;
export const GEO_MAX_SEQUENCES = 10;
export const GEO_COMPETITOR_SHARE_LIMIT = 50;
export const GEO_SHARE_OF_VOICE_TOP_BRANDS = 5;
export const GEO_SHARE_OF_VOICE_PAGE_TOP_BRANDS = 8;
export const GEO_VISIBILITY_TABLE_ROWS = GEO_SHARE_OF_VOICE_TOP_BRANDS + 1;
export const GEO_SEQUENCE_MAX_TURNS = 5;
export const GEO_GROUNDED_MAX_PROMPTS = 6;
export const GEO_GROUNDED_MAX_SEARCHES = 3;
export const GEO_ANSWER_MAX_TOKENS = 600;
export const GEO_GROUNDED_ANSWER_MAX_TOKENS = 1200;
export const GEO_JUDGE_MAX_TOKENS = 800;
export const GEO_SCAN_CONCURRENCY = 4;
export const GEO_SCAN_DEFAULT_INTERVAL_HOURS = 48;
export const GEO_SCAN_INTERVAL_OPTIONS = [
  { value: 24, label: "Every day", short: "Daily" },
  {
    value: GEO_SCAN_DEFAULT_INTERVAL_HOURS,
    label: "Every 48 hours",
    short: "48 hours",
  },
  { value: 3 * 24, label: "Every 3 days", short: "3 days" },
  { value: 7 * 24, label: "Every week", short: "Weekly" },
  { value: 14 * 24, label: "Every 2 weeks", short: "2 weeks" },
  { value: 30 * 24, label: "Every 30 days", short: "30 days" },
] as const;
export const GEO_SCAN_INTERVAL_HOURS = GEO_SCAN_INTERVAL_OPTIONS.map(
  (option) => option.value
);
export const GEO_SCAN_INTERVAL_LABEL_PREFIX = /^Every\s+/;
export const GEO_SCAN_INTERVAL_FALLBACK_NOUN = "scan interval";
export const GEO_SCAN_WORKFLOW_PATH = "/api/workflows/geo-scan";
export const GEO_SCAN_STALE_MS = 2 * 60 * 60 * 1000;
export const GEO_SCAN_POLL_INTERVAL_MS = 3000;
export const GEO_START_SCAN_MUTATION_KEY = "geo-start-scan";
export const GEO_EXCERPT_MAX_LENGTH = 300;
export const GEO_PROMPT_MIN_LENGTH = 8;
export const GEO_PROMPT_MAX_LENGTH = 300;
export const GEO_GAP_TITLE_MAX_LENGTH = 160;
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
export const GEO_DISCOVERY_CACHE_PREFIX = "geo:discovery:v1";
export const GEO_DISCOVERY_CACHE_TTL_SECONDS = 60 * 60;
export const GEO_COMPETITOR_SUGGESTIONS_CACHE_PREFIX =
  "geo:competitor-suggestions:v1";
export const GEO_INGEST_IDENTITY_CACHE_PREFIX = "geo:ingest-identity:v1";
export const GEO_INGEST_TOKEN_GENERATION_CACHE_PREFIX = "geo:ingest-gen:v1";
export const GEO_INGEST_IDENTITY_ACTIVE_TTL_SECONDS = 5 * 60;
export const GEO_INGEST_IDENTITY_INACTIVE_TTL_SECONDS = 60;
export const GEO_ONBOARDING_MAX_PROMPTS = 30;
export const GEO_ONBOARDING_SUGGESTED_COMPETITORS = 10;
export const GEO_BRAND_SEARCH_MIN_QUERY_LENGTH = 2;
export const GEO_BRAND_SEARCH_MAX_QUERY_LENGTH = 100;
export const GEO_BRAND_SEARCH_DEBOUNCE_MS = 300;
export const GEO_BRAND_SEARCH_STALE_MS = 5 * 60 * 1000;
export const GEO_DISCOVERY_SYSTEM_PROMPT =
  "You are a search visibility analyst and content strategist. You read a company's website and derive the brand identity and the buyer questions that decide whether an AI assistant recommends this company. Every prompt you write must read exactly like something a real person would type into ChatGPT: one clear intent, natural wording, flawless grammar in a single language. Never string keywords together. Respond only with the requested structured data.";
export const GEO_ANSWER_SYSTEM_PROMPT =
  "You are a helpful AI assistant. Answer the user's question directly and concretely, naming specific products or companies where relevant.";

export const AI_TRAFFIC_DEFAULT_DAYS = 30;
export const AI_TRAFFIC_DEFAULT_LOG_LIMIT = 50;
export const AI_TRAFFIC_DEFAULT_PAGES_LIMIT = 20;
export const GEO_CITATIONS_ROW_HEIGHT = 40;
export const GEO_CITATIONS_LIVE_INTERVAL_MS = 5000;
export const GEO_INGEST_PATH = "/api/geo/ingest";
export const GEO_INGEST_SNIPPET_FALLBACK =
  "// Set GEO_INGEST_SECRET to generate your install snippet";
export const GEO_INGEST_PACKAGE = "@usenotra/geo";
export const GEO_INGEST_PACKAGE_MANAGER_OPTIONS = [
  { value: "bun", label: "bun", command: `bun add ${GEO_INGEST_PACKAGE}` },
  { value: "pnpm", label: "pnpm", command: `pnpm add ${GEO_INGEST_PACKAGE}` },
  { value: "yarn", label: "yarn", command: `yarn add ${GEO_INGEST_PACKAGE}` },
  { value: "npm", label: "npm", command: `npm install ${GEO_INGEST_PACKAGE}` },
] as const satisfies readonly {
  value: GeoIngestPackageManager;
  label: string;
  command: string;
}[];
export const GEO_INGEST_DEFAULT_PACKAGE_MANAGER: GeoIngestPackageManager =
  "bun";
export const GEO_INGEST_INSTALL_COMMAND =
  GEO_INGEST_PACKAGE_MANAGER_OPTIONS[0].command;
export const GEO_INGEST_TOKEN_ENV = "NOTRA_GEO_TOKEN";
export const GEO_INGEST_DEFAULT_FRAMEWORK: GeoIngestFramework = "next";
export const GEO_INGEST_FRAMEWORK_OPTIONS = [
  { value: "next", label: "Next.js", file: "proxy.ts" },
  { value: "nuxt", label: "Nuxt", file: "server/middleware/geo.ts" },
  {
    value: "netlify",
    label: "Netlify",
    file: "netlify/edge-functions/geo.ts",
  },
] as const satisfies readonly {
  value: GeoIngestFramework;
  label: string;
  file: string;
}[];
export const GEO_INGEST_SECRET_ENV = "GEO_INGEST_SECRET";
export const GEO_INGEST_SECRET_FALLBACK_ENV = "BEACON_INGEST_SECRET";
export const GEO_INGEST_TOKEN_SEPARATOR = ".";
export const GEO_INGEST_BEARER_PREFIX = "Bearer ";
export const GEO_MAX_STORED_UA_LENGTH = 512;
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
  { value: "all", label: "All types", description: "Every tracked competitor" },
  { value: "direct", label: "Direct", description: "Sells what you sell" },
  {
    value: "indirect",
    label: "Indirect",
    description: "Solves the same problem differently",
  },
] as const;

export const GEO_COMPETITOR_KIND_DETAIL: Record<GeoCompetitorKind, string> = {
  direct: "Direct competitor",
  indirect: "Indirect competitor",
};

export const COMPETITORS_TABLE_HEIGHT = 420;
export const COMPETITOR_PROMPTS_TABLE_HEIGHT = 288;
export const COMPETITOR_PROMPTS_PAGE_TABLE_HEIGHT = 620;
export const COMPETITORS_TABLE_ROW_HEIGHT = 52;

export const PROMPTS_TABLE_HEIGHT = 420;
export const PROMPTS_TABLE_ROW_HEIGHT = 52;

export const GEO_JOURNEY_DEEP_CRAWL_PAGES = 10;
export const GEO_LOGO_DEBOUNCE_MS = 500;
export const GEO_COLOR_DEBOUNCE_MS = 200;
export const GEO_PROMPT_FUNNEL_TOP_POSITION = 3;

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
  "training-crawler": "Model training",
  "search-index": "Search index",
  "assistant-browse": "Cited in answer",
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

export const GEO_TRAFFIC_TREND_CRAWLER_KEY = "crawler";
export const GEO_TRAFFIC_TREND_REFERRAL_KEY = "aiReferral";
export const GEO_TRAFFIC_TREND_CRAWLER_LABEL = "Crawlers";
export const GEO_TRAFFIC_TREND_REFERRAL_LABEL = "Referrals";
export const GEO_TRAFFIC_CRAWLER_HINT =
  "Bots fetching your pages to train models or build a search index";
export const GEO_TRAFFIC_REFERRAL_HINT =
  "People who clicked through to your site from an AI answer";

export const GEO_TRAFFIC_LOG_VISITOR_OPTIONS: readonly GeoTrafficLogVisitorOption[] =
  [
    { value: "crawler", label: "AI crawler" },
    { value: "ai_referral", label: "AI referral" },
    { value: "human", label: "Human" },
  ];

export const GEO_TRAFFIC_LOG_PURPOSE_OPTIONS: readonly GeoTrafficLogPurposeOption[] =
  [
    { value: "training-crawler", label: "Model training" },
    { value: "search-index", label: "Search index" },
    { value: "assistant-browse", label: "Cited in answer" },
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
  "retrieval-only": `${GEO_SEARCH_LABEL} only`,
  invisible: "Invisible",
};

export const GEO_SENTIMENT_LABELS: Record<string, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

export const GEO_MENTION_TREND_TOTAL_KEY = "total";
export const GEO_MENTION_TREND_TOTAL_LABEL = "All engines";
export const GEO_DEFAULT_RANGE: GeoRangePreset = "30d";
export const GEO_MENTION_TREND_AVERAGE_KEY = "average";
export const GEO_MENTION_TREND_AVERAGE_LABEL = "Average";
export const GEO_MENTION_TREND_AGENT_ICON_LIMIT = 4;
export const GEO_RANGE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
] as const satisfies readonly {
  value: GeoRangePreset;
  label: string;
}[];
export const GEO_RANGE_PRESET_DAYS = {
  today: 0,
  yesterday: 1,
  "7d": 6,
  "14d": 13,
  "30d": 29,
  "90d": 89,
} as const;
export const GEO_DEFAULT_QUERY_DAYS = 30;
export const GEO_FILTER_TRIGGER_CLASS =
  "corner-squircle flex h-7 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring";
export const GEO_MENTION_RATE_LABEL = "Mention rate";
export const GEO_SPARKLINE_MIN_POINTS = 2;
export const GEO_RATE_SPARKLINE_WIDTH = 56;
export const GEO_RATE_SPARKLINE_HEIGHT = 20;
export const GEO_RATE_SPARKLINE_PADDING = 2;
export const GEO_EMPTY_TIMESERIES: readonly GeoTimeseriesPoint[] = [];
export const GEO_EMPTY_PROMPT_RESULTS: readonly GeoPromptResult[] = [];
export const GEO_EMPTY_TRAFFIC_RESPONSE: AiTrafficResponse = {
  configured: false,
  totals: { crawler: 0, aiReferral: 0, human: 0 },
  sources: [],
  points: [],
};

export const GEO_MAX_ALIASES = 10;
export const GEO_MAX_COMPETITORS = 25;
/** Debounce before persisting GEO settings. Short enough for toggles. */
export const GEO_SETTINGS_AUTO_SAVE_MS = 800;
export const GEO_MAX_LANGUAGES = 4;
export const GEO_LANGUAGE_MAX_PROMPTS = 5;
export const GEO_LANGUAGE_GROUNDED_MAX_PROMPTS = 3;
export const GEO_TRANSLATION_MAX_TOKENS = 2000;

export const GEO_LANGUAGE_FLAGS: Record<string, string> = LANGUAGE_FLAGS;

export const COPY_FEEDBACK_MS = 2000;

export const GEO_TAB_VALUES = [
  "visibility",
  "prompts",
  "journeys",
] as const satisfies readonly GeoTab[];

export const GEO_TRAFFIC_REVEAL_MS = 150;

export const GEO_DEFAULT_TAB: GeoTab = "visibility";

export const GEO_TAB_BREADCRUMB_LABELS: Record<string, string> = {
  visibility: "Visibility",
  prompts: "Prompts",
  journeys: "Journeys",
};

export const GEO_PROMPTS_TAB_PREVIEW_LIMIT = 6;

export const GEO_LOGO_LINK_BASE = "https://logos.context.dev/";
export const GEO_LOGO_LINK_CLIENT_ID_ENV = "NEXT_PUBLIC_LOGOLINK_CLIENT_ID";
export const GEO_FAVICON_BASE = "https://icons.duckduckgo.com/ip3";
export const GEO_AVATAR_FALLBACK_BASE =
  "https://api.dicebear.com/9.x/glass/svg";
export const GEO_LOGO_SIZE_PX = 40;

export const GEO_COMPETITOR_DETAIL_DAYS = 30;
export const GEO_COMPETITOR_DETAIL_MIN_POINTS = 2;
export const GEO_COMPETITOR_DETAIL_SERIES_KEY = "mentions";
export const GEO_COMPETITOR_DETAIL_CHART_HEIGHT_CLASS = "h-56";

/** Dev-only: enables seeding GEO sample data from the settings page. */
export const GEO_SAMPLE_DATA_ENABLED = process.env.NODE_ENV === "development";

export const GEO_UPGRADE_TITLE = "Upgrade required";
export const GEO_UPGRADE_DESCRIPTION =
  "AI visibility tracking is included in Starter, Growth, and Scale. Pick a plan to unlock GEO for this workspace.";
export const GEO_UPGRADE_TOOLTIP = "Upgrade your plan to unlock GEO";
export const GEO_LOCKED_TITLE = "GEO is locked on your current plan";
